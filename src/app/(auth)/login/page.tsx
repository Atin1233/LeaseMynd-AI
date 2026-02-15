"use client";
// @ts-nocheck - Supabase type inference issues
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "~/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal?.currentLevel === "aal1") {
      router.push(`/mfa-verify?redirect=${encodeURIComponent(redirectTo)}`);
    } else {
      router.push(redirectTo);
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-50 p-12 flex-col">
        <div className="w-full flex items-center justify-center mt-20 mb-8">
          <Link href="/" className="flex items-center justify-center w-3/4">
            <img
              src="/mainleasemyndailogo.png"
              alt="LeaseAI"
              className="w-full h-auto object-contain max-w-full"
              style={{
                backgroundColor: "transparent",
                mixBlendMode: "multiply",
              }}
            />
          </Link>
        </div>

        <div className="mt-auto">
          <h1 className="text-4xl font-semibold text-stone-900 mb-4 heading-font leading-tight">
            Commercial lease analysis,
            <br />
            simplified.
          </h1>
          <p className="text-stone-600 text-lg">
            AI-powered insights to help you understand and negotiate better lease
            terms.
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
              src="/mainleasemyndailogo.png"
              alt="LeaseAI"
              className="w-3/4 h-auto object-contain max-w-full"
              style={{
                backgroundColor: "transparent",
                mixBlendMode: "multiply",
              }}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 mb-2 heading-font">
              Sign in to your account
            </h2>
            <p className="text-stone-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create one
              </Link>
              {" "}·{" "}
              <Link
                href="/employer/signup"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Employer / Employee
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-none flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
