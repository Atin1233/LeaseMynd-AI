// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
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

const MAX_BATCH_SIZE = 50;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file

/** POST: upload multiple leases (up to 50). FormData: files[] (File), titles[] (optional), dueDiligence (optional boolean for fast scan). */
export async function POST(request: Request) {
  const tempPaths: string[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "User not associated with an organization" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const dueDiligence = formData.get("dueDiligence") === "true";
    const files: File[] = [];
    const titlesByIndex: Record<number, string> = {};

    for (const [key, value] of formData.entries()) {
      if ((key === "files" || key.startsWith("files[")) && value instanceof File) {
        files.push(value);
      } else if (key.startsWith("titles[") && typeof value === "string") {
        const match = key.match(/titles\[(\d+)\]/);
        if (match) titlesByIndex[parseInt(match[1]!, 10)] = value;
      }
    }
    const titles = files.map((_, i) => titlesByIndex[i] ?? "");

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }
    if (files.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BATCH_SIZE} files per batch` },
        { status: 400 }
      );
    }

    const results: { id: string; title: string; status: string; error?: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const title = (titles[i]?.trim()) || file.name.replace(/\.[^/.]+$/, "");

      if (!ALLOWED_TYPES.includes(file.type)) {
        results.push({ id: "", title: file.name, status: "error", error: "Invalid file type" });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        results.push({ id: "", title: file.name, status: "error", error: "File too large (max 50MB)" });
        continue;
      }

      let tempFilePath: string | null = null;
      try {
        const fileExt = file.name.split(".").pop() || "pdf";
        const fileName = `${profile.organization_id}/${randomUUID()}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
          .from("leases")
          .upload(fileName, buffer, { contentType: file.type, upsert: false });

        if (uploadError) {
          results.push({ id: "", title, status: "error", error: "Storage upload failed" });
          continue;
        }

        const { data: urlData } = supabase.storage.from("leases").getPublicUrl(fileName);
        const fileUrl = urlData.publicUrl;

        const { data: leaseData, error: leaseError } = await supabase
          .from("leases")
          .insert({
            organization_id: profile.organization_id,
            uploaded_by: user.id,
            title,
            file_url: fileUrl,
            file_size_bytes: file.size,
            status: "processing",
          })
          .select()
          .maybeSingle();

        if (leaseError || !leaseData) {
          results.push({ id: "", title, status: "error", error: "Failed to create lease record" });
          continue;
        }

        tempFilePath = path.join(os.tmpdir(), `lease-batch-${randomUUID()}.pdf`);
        tempPaths.push(tempFilePath);
        await fs.writeFile(tempFilePath, buffer);

        const docs = await loadPdfFromPath(tempFilePath);
        if (docs.length === 0) {
          await supabase.from("leases").update({ status: "failed" }).eq("id", leaseData.id);
          results.push({ id: leaseData.id, title, status: "failed", error: "No readable content" });
          continue;
        }

        await supabase
          .from("leases")
          .update({ page_count: docs.length })
          .eq("id", leaseData.id);

        const splits = await splitPdfIntoChunks(docs);
        const chunksToInsert = splits.map((split, index) => {
          const metadata = split.metadata as { loc?: { pageNumber?: number } };
          return {
            lease_id: leaseData.id,
            page: metadata?.loc?.pageNumber ?? 1,
            chunk_index: index,
            content: sanitizeChunkContent(split.pageContent),
          };
        });

        const chunkBatchSize = 100;
        for (let j = 0; j < chunksToInsert.length; j += chunkBatchSize) {
          const batch = chunksToInsert.slice(j, j + chunkBatchSize);
          await supabase.from("lease_chunks").insert(batch);
        }

        await supabase
          .from("leases")
          .update({ status: "pending" })
          .eq("id", leaseData.id);

        results.push({
          id: leaseData.id,
          title,
          status: dueDiligence ? "pending_fast" : "pending",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        results.push({ id: "", title: file.name, status: "error", error: msg });
      } finally {
        if (tempFilePath) {
          await fs.unlink(tempFilePath).catch(() => {});
          const idx = tempPaths.indexOf(tempFilePath);
          if (idx >= 0) tempPaths.splice(idx, 1);
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
      dueDiligence,
    });
  } catch (error) {
    console.error("Batch upload error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  } finally {
    for (const p of tempPaths) {
      await fs.unlink(p).catch(() => {});
    }
  }
}
