"use client";
// @ts-nocheck - Supabase type inference issues
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { User, Building2, CreditCard, Loader2, Check, Palette, Key, Download, Trash2, Copy } from "lucide-react";
import { TwoFactorSection } from "./_components/TwoFactorSection";
import { useToast } from "~/lib/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: string | null;
  organization_id: string | null;
}

interface Organization {
  id: string;
  name: string;
  plan: string | null;
  monthly_analysis_limit: number | null;
  analyses_used_this_month: number | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [branding, setBranding] = useState<{
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    custom_domain: string | null;
  } | null>(null);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key_prefix: string; last_used_at: string | null; created_at: string; revoked_at: string | null }[]>([]);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [dataExporting, setDataExporting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser({ id: user.id, email: user.email || "" });
      
      // Fetch profile separately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profileData) {
        const p = profileData as unknown as Profile;
        setProfile(p);
        setFullName(p.full_name || "");
        if (p.organization_id) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", p.organization_id)
            .single();
          if (orgData) {
            const o = orgData as unknown as Organization;
            setOrg(o);
            setOrgName(o.name || "");
            if (o.plan === "broker" || o.plan === "free") {
              const res = await fetch("/api/branding");
              const data = await res.json();
              setBranding(data.branding ?? { logo_url: null, primary_color: null, secondary_color: null, custom_domain: null });
            }
            const keyRes = await fetch("/api/api-keys");
            const keyData = await keyRes.json();
            if (Array.isArray(keyData.apiKeys)) setApiKeys(keyData.apiKeys);
          }
        }
      }
      
      setLoading(false);
    }
    
    loadData();
  }, [router]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    const supabase = createClient();
    
    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      // @ts-expect-error - Supabase type inference
      .update({ full_name: fullName })
      .eq("id", user.id);
    
    if (profileError) {
      console.error("Error updating profile:", JSON.stringify(profileError, null, 2));
      toast.error("Failed to update profile", {
        description: profileError.message || "Please try again",
      });
      setSaving(false);
      return;
    }
    
    // Update or create organization
    if (org) {
      const { error: orgError } = await supabase
        .from("organizations")
        // @ts-expect-error - Supabase type inference
        .update({ name: orgName })
        .eq("id", org.id);
      
      if (orgError) {
        console.error("Error updating organization:", orgError);
        toast.error("Failed to update organization", {
          description: orgError.message || "Please try again",
        });
      } else {
        toast.success("Profile updated successfully");
      }
    } else if (orgName) {
      // In development, use broker plan (highest tier)
      const defaultPlan =
        typeof window !== "undefined" && window.location.hostname.includes("localhost")
          ? "broker"
          : "free";
      const defaultLimit = defaultPlan === "broker" || defaultPlan === "free" ? -1 : 3;

      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        // @ts-expect-error - Supabase type inference
        .insert({ name: orgName, plan: defaultPlan, monthly_analysis_limit: defaultLimit })
        .select()
        .single();
      
      if (orgError) {
        console.error("Error creating organization:", orgError);
        toast.error("Failed to create organization", {
          description: orgError.message || "Please try again",
        });
      } else if (newOrg) {
        await supabase
          .from("profiles")
          // @ts-expect-error - Supabase type inference
          .update({ organization_id: newOrg.id, role: "owner" })
          .eq("id", user.id);
        
        setOrg(newOrg);
        toast.success("Organization created successfully");
      }
    } else {
      toast.success("Profile updated successfully");
    }
    
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCreateApiKey = async () => {
    setApiKeyLoading(true);
    setCreatedKey(null);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() || "API key" }),
      });
      const data = await res.json();
      if (res.ok && data.apiKey?.key) {
        setCreatedKey(data.apiKey.key);
        setNewKeyName("");
        const listRes = await fetch("/api/api-keys");
        const listData = await listRes.json();
        if (Array.isArray(listData.apiKeys)) setApiKeys(listData.apiKeys);
        toast.success("API key created. Copy it now; it won't be shown again.");
      } else {
        toast.error(data.error ?? "Failed to create key");
      }
    } catch {
      toast.error("Failed to create API key");
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
        toast.success("API key revoked");
      } else {
        toast.error("Failed to revoke key");
      }
    } catch {
      toast.error("Failed to revoke key");
    }
  };

  const handleDataExport = async () => {
    setDataExporting(true);
    try {
      const res = await fetch("/api/data-export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leaseai-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data export downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setDataExporting(false);
    }
  };

  const handleSaveBranding = async () => {
    if (branding === null) return;
    setBrandingSaving(true);
    try {
      const res = await fetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Branding updated");
      } else {
        toast.error(data.error ?? "Failed to save branding");
      }
    } catch {
      toast.error("Failed to save branding");
    } finally {
      setBrandingSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const usagePercent = org
    ? org.monthly_analysis_limit === -1 ? 0 : Math.min(100, ((org.analyses_used_this_month || 0) / (org.monthly_analysis_limit || 3)) * 100)
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 heading-font">Settings</h1>
          <p className="text-stone-500 mt-1">Manage your account and organization</p>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white font-medium py-2.5 px-5 rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="bg-white rounded-none border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-stone-100 rounded-none flex items-center justify-center">
              <User className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 heading-font">Profile</h2>
              <p className="text-sm text-stone-500">Your personal information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-none py-2.5 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Email
              </label>
              <div className="bg-stone-50 border border-stone-200 rounded-none py-2.5 px-4 text-stone-500">
                {user?.email}
              </div>
            </div>
          </div>
        </section>

        {/* Organization Section */}
        <section className="bg-white rounded-none border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-none flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 heading-font">Organization</h2>
              <p className="text-sm text-stone-500">
                {org ? "Your team settings" : "Set up to start analyzing"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-none py-2.5 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Your company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Plan
              </label>
              <div className="bg-stone-50 border border-stone-200 rounded-none py-2.5 px-4 text-stone-600 capitalize">
                {org?.plan || "Free"}
              </div>
            </div>
          </div>
          
          {!org && (
            <p className="text-sm text-amber-600 mt-4">
              Add an organization name and save to start analyzing leases.
            </p>
          )}
        </section>

        {/* Usage Section */}
        <section className="bg-white rounded-none border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-none flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 heading-font">Usage</h2>
              <p className="text-sm text-stone-500">Your monthly analysis quota</p>
            </div>
          </div>

          <div className="bg-stone-50 rounded-none p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-stone-600">Analyses this month</span>
              <span className="font-semibold text-stone-900">
                {org?.analyses_used_this_month || 0} {org?.monthly_analysis_limit === -1 ? "(Unlimited)" : `/ ${org?.monthly_analysis_limit || 3}`}
              </span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-none overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-none transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-stone-500 mt-3">
              Resets on the 1st of each month
            </p>
          </div>
        </section>

        {/* White-label (Broker) */}
        {(org?.plan === "broker" || org?.plan === "free") && (
          <section className="bg-white rounded-none border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-50 rounded-none flex items-center justify-center">
                <Palette className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 heading-font">White-label (Broker)</h2>
                <p className="text-sm text-stone-500">Custom logo and colors on shared analysis links</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Logo URL</label>
                <input
                  type="url"
                  value={branding?.logo_url ?? ""}
                  onChange={(e) => setBranding((b) => ({ logo_url: e.target.value || null, primary_color: b?.primary_color ?? null, secondary_color: b?.secondary_color ?? null, custom_domain: b?.custom_domain ?? null }))}
                  className="w-full bg-white border border-stone-300 rounded-none py-2.5 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Primary color (hex)</label>
                <input
                  type="text"
                  value={branding?.primary_color ?? ""}
                  onChange={(e) => setBranding((b) => ({ logo_url: b?.logo_url ?? null, primary_color: e.target.value || null, secondary_color: b?.secondary_color ?? null, custom_domain: b?.custom_domain ?? null }))}
                  className="w-full bg-white border border-stone-300 rounded-none py-2.5 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#1c1917"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Secondary color (hex)</label>
                <input
                  type="text"
                  value={branding?.secondary_color ?? ""}
                  onChange={(e) => setBranding((b) => ({ ...b!, secondary_color: e.target.value || null }))}
                  className="w-full bg-white border border-stone-300 rounded-none py-2.5 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#78716c"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Custom domain (optional)</label>
                <input
                  type="text"
                  value={branding?.custom_domain ?? ""}
                  onChange={(e) => setBranding((b) => ({ logo_url: b?.logo_url ?? null, primary_color: b?.primary_color ?? null, secondary_color: b?.secondary_color ?? null, custom_domain: e.target.value || null }))}
                  className="w-full bg-white border border-stone-300 rounded-none py-2.5 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="app.yourcompany.com"
                />
              </div>
            </div>
            <button
              onClick={handleSaveBranding}
              disabled={brandingSaving}
              className="mt-4 flex items-center gap-2 bg-violet-600 text-white font-medium py-2.5 px-5 rounded-none hover:bg-violet-700 disabled:opacity-50"
            >
              {brandingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save branding
            </button>
          </section>
        )}

        {/* API keys (Growth+) */}
        {(profile?.role === "owner" || profile?.role === "admin") && (
          <section className="bg-white rounded-none border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 rounded-none flex items-center justify-center">
                <Key className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 heading-font">API keys</h2>
                <p className="text-sm text-stone-500">Create and revoke keys for API access</p>
              </div>
            </div>
            {createdKey && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-none">
                <p className="text-sm font-medium text-amber-800 mb-2">New key (copy now; it won't be shown again):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all text-sm bg-white px-2 py-2 border border-amber-200">{createdKey}</code>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(createdKey); toast.success("Copied"); }}
                    className="flex-shrink-0 p-2 border border-amber-300 hover:bg-amber-100"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name"
                className="flex-1 border border-stone-300 rounded-none py-2 px-4 text-sm"
              />
              <button
                type="button"
                onClick={handleCreateApiKey}
                disabled={apiKeyLoading}
                className="bg-amber-600 text-white font-medium py-2 px-4 rounded-none hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
              >
                {apiKeyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Create key
              </button>
            </div>
            {apiKeys.length > 0 && (
              <ul className="space-y-2">
                {apiKeys.filter((k) => !k.revoked_at).map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-4 py-2 border-b border-stone-100">
                    <div>
                      <p className="font-medium text-stone-800">{k.name}</p>
                      <p className="text-xs text-stone-500">{k.key_prefix}…</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokeApiKey(k.id)}
                      className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Data export (GDPR-style) */}
        <section className="bg-white rounded-none border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-stone-100 rounded-none flex items-center justify-center">
              <Download className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 heading-font">Data export</h2>
              <p className="text-sm text-stone-500">Download all your data (profile, org, leases, analyses)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDataExport}
            disabled={dataExporting}
            className="flex items-center gap-2 border border-stone-300 bg-white py-2.5 px-4 text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            {dataExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download my data
          </button>
        </section>

        {/* 2FA */}
        <TwoFactorSection />

        {/* Login history */}
        <section className="bg-white rounded-none border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 heading-font mb-2">Login history</h2>
          <p className="text-sm text-stone-500 mb-2">
            View recent sign-in activity and active sessions. Coming soon — we&apos;ll show device, location, and time for each session.
          </p>
          <div className="text-sm text-stone-400 bg-stone-50 p-4 rounded-lg">
            Your current session is active. To sign out everywhere, use Sign out from the profile menu.
          </div>
        </section>
      </div>
    </div>
  );
}
