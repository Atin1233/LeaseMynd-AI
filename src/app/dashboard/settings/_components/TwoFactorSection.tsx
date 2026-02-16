"use client";

import { useState, useEffect } from "react";
import { createClient } from "~/lib/supabase/client";
import { Shield, Loader2, Check, X, Smartphone } from "lucide-react";
import { useToast } from "~/lib/hooks/use-toast";

export function TwoFactorSection() {
  const toast = useToast();
  const [factors, setFactors] = useState<{ id: string; friendly_name?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollStep, setEnrollStep] = useState<"idle" | "qr" | "verify">("idle");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [unenrolling, setUnenrolling] = useState<string | null>(null);

  useEffect(() => {
    loadFactors();
  }, []);

  async function loadFactors() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data?.totp) {
      setFactors(data.totp);
    } else {
      setFactors([]);
    }
    setLoading(false);
  }

  async function startEnroll() {
    setEnrolling(true);
    setEnrollStep("qr");
    setVerifyCode("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator app",
    });
    if (error) {
      toast.error("Failed to start setup", { description: error.message });
      setEnrolling(false);
      setEnrollStep("idle");
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setEnrolling(false);
  }

  async function completeEnroll() {
    if (!factorId || !verifyCode.trim()) return;
    setEnrolling(true);
    const supabase = createClient();
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr) {
      toast.error("Verification failed", { description: chErr.message });
      setEnrolling(false);
      return;
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: verifyCode.trim(),
    });
    if (verifyErr) {
      toast.error("Invalid code", { description: verifyErr.message });
      setEnrolling(false);
      return;
    }
    toast.success("Two-factor authentication enabled");
    setEnrollStep("idle");
    setFactorId("");
    setQrCode("");
    setVerifyCode("");
    loadFactors();
    setEnrolling(false);
  }

  async function unenroll(fId: string) {
    setUnenrolling(fId);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId: fId });
    if (error) {
      toast.error("Failed to disable 2FA", { description: error.message });
    } else {
      toast.success("Two-factor authentication disabled");
      loadFactors();
    }
    setUnenrolling(null);
  }

  function cancelEnroll() {
    setEnrollStep("idle");
    setFactorId("");
    setQrCode("");
    setVerifyCode("");
  }

  const hasFactors = factors.length > 0;

  return (
    <section className="bg-white rounded-none border border-stone-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-50 rounded-none flex items-center justify-center">
          <Shield className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-900 heading-font">
            Two-factor authentication (2FA)
          </h2>
          <p className="text-sm text-stone-500">
            Add an extra layer of security with an authenticator app
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-stone-500 py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      ) : enrollStep === "qr" ? (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
          </p>
          {qrCode && (
            <div className="inline-block p-2 bg-white border border-stone-200 rounded-lg">
              {qrCode.startsWith("data:") ? (
                <img src={qrCode} alt="QR code" className="w-48 h-48" />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: qrCode }} className="[&>svg]:w-48 [&>svg]:h-48" />
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Enter the 6-digit code from your app
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full max-w-[140px] border border-stone-300 rounded-lg py-2 px-4 text-center font-mono tracking-widest"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={completeEnroll}
              disabled={enrolling || verifyCode.length !== 6}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Enable 2FA
            </button>
            <button
              onClick={cancelEnroll}
              disabled={enrolling}
              className="inline-flex items-center gap-2 border border-stone-300 px-4 py-2 text-stone-700 hover:bg-stone-50"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      ) : hasFactors ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600">
            <Check className="w-5 h-5" />
            <span className="font-medium">2FA is enabled</span>
          </div>
          {factors.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-stone-400" />
                <span className="text-stone-700">{f.friendly_name || "Authenticator app"}</span>
              </div>
              <button
                onClick={() => unenroll(f.id)}
                disabled={unenrolling === f.id}
                className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
              >
                {unenrolling === f.id ? "Removing…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <p className="text-sm text-stone-600 mb-4">
            2FA is not enabled. Enable it to protect your account with a second factor.
          </p>
          <button
            onClick={startEnroll}
            disabled={enrolling}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Enable 2FA
          </button>
        </div>
      )}
    </section>
  );
}
