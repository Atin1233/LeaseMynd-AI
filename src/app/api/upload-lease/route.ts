// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { getApiKeyAuth, touchApiKey } from "~/lib/auth/api-key";
import { applyRateLimitHeaders } from "~/lib/rate-limit-middleware";
import { createUserRateLimiter, RateLimitPresets } from "~/lib/rate-limiter";
import { randomUUID } from "crypto";
import path from "path";
import os from "os";
import fs from "fs/promises";
import {
  loadPdfFromPath,
  splitPdfIntoChunks,
  sanitizeChunkContent,
} from "~/lib/pdf/processor";

export const runtime = "nodejs";
export const maxDuration = 300;

interface UploadRequest {
  title: string;
  propertyAddress?: string;
  propertyType?: string;
  enableOCR?: boolean;
}

export async function POST(request: Request) {
  let tempFilePath: string | null = null;

  try {
    const apiKeyAuth = await getApiKeyAuth(request);
    const supabase = await createClient();
    let organizationId: string | null = null;
    let userId: string | null = null;

    if (apiKeyAuth) {
      organizationId = apiKeyAuth.organizationId;
      void touchApiKey(apiKeyAuth.keyId);
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError || !profile?.organization_id) {
        return NextResponse.json(
          { error: "User not associated with an organization" },
          { status: 400 }
        );
      }
      organizationId = profile.organization_id;
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitKey = userId ?? apiKeyAuth?.keyId ?? "anon";
    const rateLimiter = createUserRateLimiter(rateLimitKey, RateLimitPresets.upload);
    const rateLimitInfo = await rateLimiter(request);
    if (!rateLimitInfo.allowed) {
      const res = NextResponse.json(
        { error: "Rate limit exceeded", message: "Too many uploads.", retryAfter: rateLimitInfo.retryAfter },
        { status: 429 }
      );
      return applyRateLimitHeaders(res, rateLimitInfo);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const propertyAddress = formData.get("propertyAddress") as string | null;
    const propertyType = formData.get("propertyType") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF or Word document." },
        { status: 400 }
      );
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop() || "pdf";
    const fileName = `${profile.organization_id}/${randomUUID()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("leases")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from("leases")
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    // Create lease record in database
    const { data: leaseData, error: leaseError } = await supabase
      .from("leases")
      .insert({
        organization_id: organizationId,
        uploaded_by: userId,
        title,
        property_address: propertyAddress,
        property_type: propertyType as any,
        file_url: fileUrl,
        file_size_bytes: file.size,
        status: "processing",
      })
      .select()
      .maybeSingle();

    if (leaseError || !leaseData) {
      console.error("Lease insert error:", leaseError);
      return NextResponse.json(
        { error: "Failed to create lease record" },
        { status: 500 }
      );
    }
    
    const lease = leaseData;

    // Process PDF and extract text (shared processor)
    tempFilePath = path.join(os.tmpdir(), `lease-${randomUUID()}.pdf`);
    await fs.writeFile(tempFilePath, buffer);

    const docs = await loadPdfFromPath(tempFilePath);

    if (docs.length === 0) {
      await supabase
        .from("leases")
        .update({ status: "failed" })
        .eq("id", lease.id);

      return NextResponse.json(
        { error: "No readable content found in the PDF" },
        { status: 422 }
      );
    }

    await supabase
      .from("leases")
      .update({ page_count: docs.length })
      .eq("id", lease.id);

    const splits = await splitPdfIntoChunks(docs);

    const chunksToInsert = splits.map((split, index) => {
      const metadata = split.metadata as { loc?: { pageNumber?: number } };
      return {
        lease_id: lease.id,
        page: metadata?.loc?.pageNumber ?? 1,
        chunk_index: index,
        content: sanitizeChunkContent(split.pageContent),
      };
    });

    // Insert chunks in batches
    const batchSize = 100;
    for (let i = 0; i < chunksToInsert.length; i += batchSize) {
      const batch = chunksToInsert.slice(i, i + batchSize);
      
      const { error: chunkError } = await supabase
        .from("lease_chunks")
        .insert(batch);

      if (chunkError) {
        console.error("Chunk insert error:", chunkError);
      }
    }

    // Update lease status to pending (ready for analysis)
    await supabase
      .from("leases")
      .update({ status: "pending" })
      .eq("id", lease.id);

    const res = NextResponse.json(
      {
        success: true,
        lease: {
          id: lease.id,
          title: lease.title,
          status: "pending",
          pageCount: docs.length,
          chunksCreated: chunksToInsert.length,
        },
        message: "Lease uploaded successfully. Ready for analysis.",
      },
      { status: 201 }
    );
    return applyRateLimitHeaders(res, rateLimitInfo);
  } catch (error) {
    console.error("Upload lease error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    // Cleanup temp file
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }
  }
}

