// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

// GET - List all leases for user's organization
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    let query = supabase
      .from("leases")
      .select(
        `
        id,
        title,
        property_address,
        property_type,
        status,
        page_count,
        created_at,
        updated_at,
        lease_analyses (
          id,
          risk_score,
          risk_level,
          created_at
        )
      `,
        { count: "exact" }
      )
      .eq("organization_id", profile.organization_id);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    // Apply sorting
    const ascending = sortOrder === "asc";
    query = query.order(sortBy as any, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: leases, error: leasesError, count } = await query;

    if (leasesError) {
      console.error("Fetch leases error:", leasesError);
      return NextResponse.json(
        { error: "Failed to fetch leases" },
        { status: 500 }
      );
    }

    // Transform to include latest analysis info
    const transformedLeases = leases?.map((lease) => {
      const analyses = lease.lease_analyses as any[];
      const latestAnalysis = analyses?.[0] || null;

      return {
        id: lease.id,
        title: lease.title,
        propertyAddress: lease.property_address,
        propertyType: lease.property_type,
        status: lease.status,
        pageCount: lease.page_count,
        createdAt: lease.created_at,
        updatedAt: lease.updated_at,
        riskScore: latestAnalysis?.risk_score ?? null,
        riskLevel: latestAnalysis?.risk_level ?? null,
        analyzedAt: latestAnalysis?.created_at ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      leases: transformedLeases || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("List leases error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a lease
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leaseId = searchParams.get("id");

    if (!leaseId) {
      return NextResponse.json(
        { error: "Lease ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("organization_id, file_url")
      .eq("id", leaseId)
      .maybeSingle();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (leaseError || !lease || profileError || !profile || profile.organization_id !== lease.organization_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only owners and admins can delete
    if (!["owner", "admin"].includes(profile.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Delete file from storage
    if (lease.file_url) {
      const fileName = lease.file_url.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("leases")
          .remove([`${profile.organization_id}/${fileName}`]);
      }
    }

    // Delete lease (cascades to chunks, analyses, clauses)
    const { error: deleteError } = await supabase
      .from("leases")
      .delete()
      .eq("id", leaseId);

    if (deleteError) {
      console.error("Delete lease error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete lease" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lease deleted successfully",
    });
  } catch (error) {
    console.error("Delete lease error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

