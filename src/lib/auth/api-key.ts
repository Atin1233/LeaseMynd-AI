import { createHash } from "crypto";
import { createAdminClient } from "~/lib/supabase/server";

const KEY_PREFIX = "lai_";
const PREFIX_LENGTH = KEY_PREFIX.length + 8;

export interface ApiKeyAuth {
  organizationId: string;
  keyId: string;
}

/**
 * Validate Bearer token as API key. Returns org + key id if valid; null otherwise.
 * Caller should use session auth when this returns null.
 */
export async function getApiKeyAuth(request: Request): Promise<ApiKeyAuth | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const raw = authHeader.slice(7).trim();
  if (!raw.startsWith(KEY_PREFIX) || raw.length < PREFIX_LENGTH) return null;

  const prefix = raw.slice(0, PREFIX_LENGTH);
  const hash = createHash("sha256").update(raw).digest("hex");

  const supabase = await createAdminClient();
  const { data: key } = await supabase
    .from("api_keys")
    .select("id, organization_id, key_hash")
    .eq("key_prefix", prefix)
    .is("revoked_at", null)
    .maybeSingle() as { data: { id: string; organization_id: string; key_hash: string } | null };

  if (!key || key.key_hash !== hash) return null;

  return { organizationId: key.organization_id, keyId: key.id };
}

/**
 * Update last_used_at for the API key (fire-and-forget).
 */
export async function touchApiKey(keyId: string): Promise<void> {
  try {
    const supabase = await createAdminClient();
    // api_keys may not be in generated Supabase types
    const apiKeys = supabase.from("api_keys") as unknown as {
      update: (value: { last_used_at: string }) => { eq: (col: string, id: string) => Promise<unknown> };
    };
    await apiKeys.update({ last_used_at: new Date().toISOString() }).eq("id", keyId);
  } catch {
    // ignore
  }
}
