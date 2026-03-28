"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "~/lib/supabase/client";
import { Loader2, AlertCircle, CheckCircle, Lock } from "lucide-react";

const DEMO_PASSCODE = "dl245658";

export default function VerifyPasscodePage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Verify the passcode
    if (passcode !== DEMO_PASSCODE) {
      setError("Invalid passcode. Please try again.");
      setLoading(false);
      return;
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    // Update profile with passcode verification
    // @ts-ignore - Supabase type inference issue
    const { error: updateError } = await supabase
      .from("profiles")
      // @ts-ignore - Supabase type inference issue
      .update({ demo_passcode_verified: true })
      .eq("id", user.id);

    if (updateError) {
      setError("Failed to verify passcode. Please try again.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-none flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-3 heading-font">
            Access Granted
          </h1>
          <p className="text-stone-500 mb-6">
            Passcode verified successfully. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-50 p-12 flex-col">
        <div className="w-full flex items-center justify-center mt-20 mb-8">
          <Link href="/" className="flex items-center justify-center w-3/4">
            <img 
              src="/leasemyndaiapplogo.png" 
              alt="LeaseAI" 
              className="w-full h-auto object-contain max-w-full"
              style={{ 
                backgroundColor: 'transparent',
                mixBlendMode: 'multiply'
              }}
            />
          </Link>
        </div>
        
        <div className="mt-auto">
          <h1 className="text-4xl font-semibold text-stone-900 mb-4 heading-font leading-tight">
            Demo Access Required
          </h1>
          <p className="text-stone-600 text-lg">
            Enter the demo passcode to access the application.
          </p>
        </div>

        <div className="text-stone-400 text-sm mt-auto">
          © 2026 LeaseAI. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-10 w-full">
            <img 
              src="/leasemyndaiapplogo.png" 
              alt="LeaseAI" 
              className="w-3/4 h-auto object-contain max-w-full"
              style={{ 
                backgroundColor: 'transparent',
                mixBlendMode: 'multiply'
              }}
            />
          </div>

          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-none flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900 mb-2 heading-font">
              Enter Demo Passcode
            </h2>
            <p className="text-stone-500">
              This application requires a demo passcode to access.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-none flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label htmlFor="passcode" className="block text-sm font-medium text-stone-700 mb-2">
                Demo Passcode
              </label>
              <input
                id="passcode"
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter passcode"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !passcode}
              className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Passcode"
              )}
            </button>
          </form>

          <div className="mt-8 space-y-3 text-center">
            <p className="text-stone-400 text-sm">
              Don&apos;t have a passcode? Contact the administrator.
            </p>
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
