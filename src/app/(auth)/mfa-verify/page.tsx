"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "~/lib/supabase/client";
import { Loader2, Shield, AlertCircle } from "lucide-react";

function MfaVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [needsMfa, setNeedsMfa] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setChecking(false);
      if (aalError || !data) {
        router.replace("/login");
        return;
      }
      if (data.currentLevel === "aal2") {
        router.replace(redirectTo);
        return;
      }
      if (data.nextLevel === "aal2" && data.currentLevel === "aal1") {
        setNeedsMfa(true);
      } else {
        router.replace(redirectTo);
      }
    })();
  }, [router, redirectTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

    if (factorsError || !factors?.totp?.length) {
      setError("No authenticator app configured. Please set up 2FA in Settings.");
      setLoading(false);
      return;
    }

    const firstTotp = factors.totp[0];
    if (!firstTotp) {
      setError("No authenticator app configured. Please set up 2FA in Settings.");
      setLoading(false);
      return;
    }
    const factorId = firstTotp.id;
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });

    if (challengeError || !challenge) {
      setError(challengeError?.message ?? "Failed to get verification challenge.");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!needsMfa) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-7 h-7 text-blue-600" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-stone-900 text-center mb-2">
          Two-factor authentication
        </h1>
        <p className="text-stone-500 text-sm text-center mb-6">
          Enter the 6-digit code from your authenticator app
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full bg-white border border-stone-300 rounded-lg py-3 px-4 text-center text-lg tracking-[0.5em] font-mono text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying…
              </>
            ) : (
              "Verify"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-stone-400 mt-6">
          <Link href="/auth/signout" className="text-stone-500 hover:text-stone-700">
            Sign out
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function MfaVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <MfaVerifyContent />
    </Suspense>
  );
}
