"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "~/lib/supabase/client";
import type { Database } from "~/lib/supabase/types";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

function SignupFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite_token") ?? null;

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{
    organizationName: string;
    role: string;
  } | null>(null);

  // Fetch invite info if token exists
  useEffect(() => {
    if (inviteToken) {
      fetch(`/api/team/invite/info?token=${inviteToken}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setInviteInfo(data.invite);
            setEmail(data.invite.email);
          } else {
            setError(data.error || "Invalid invitation");
          }
        })
        .catch(() => {
          setError("Failed to load invitation details");
        });
    }
  }, [inviteToken]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Failed to create account. Please try again.");
      setLoading(false);
      return;
    }

    // If there's an invite token, accept the invite instead of creating org
    if (inviteToken) {
      const acceptResponse = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteToken }),
      });

      const acceptData = await acceptResponse.json();

      if (!acceptResponse.ok || !acceptData.success) {
        setError(
          acceptData.error ||
            "Failed to accept invitation. Please contact the person who invited you."
        );
        setLoading(false);
        return;
      }

      // Update profile with full name
      await supabase
        .from("profiles")
        // @ts-expect-error - Supabase type inference issue with profiles update
        .update({ full_name: fullName })
        .eq("id", authData.user.id);
    } else {
      // Create organization (normal signup flow)
      // In development, use broker plan (highest tier)
      const defaultPlan =
        typeof window !== "undefined" && window.location.hostname.includes("localhost")
          ? "broker"
          : "free";
      const defaultLimit = defaultPlan === "broker" || defaultPlan === "free" ? -1 : 3;

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        // @ts-ignore - Supabase type inference issue with organizations table
        .insert({
          name: organizationName,
          plan: defaultPlan,
          monthly_analysis_limit: defaultLimit,
        })
        .select()
        .single();

      if (orgError) {
        console.error("Organization creation error:", orgError);
      }

      // Update profile with organization
      if (org) {
        await supabase
          .from("profiles")
          // @ts-ignore - Supabase type inference issue with profiles table
          .update({
            // @ts-ignore - Supabase type inference issue
            organization_id: org.id,
            full_name: fullName,
            role: "owner",
          })
          .eq("id", authData.user.id);
      }
    }

    setSuccess(true);
    setLoading(false);

    // If email confirmation is disabled, redirect to dashboard
    if (authData.session) {
      router.push("/dashboard");
      router.refresh();
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-none flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-3 heading-font">
            Check your email
          </h1>
          <p className="text-stone-500 mb-6">
            We&apos;ve sent a confirmation link to{" "}
            <span className="text-stone-900 font-medium">{email}</span>
          </p>
          <p className="text-stone-400 text-sm">
            Click the link in the email to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block mt-8 text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to sign in
          </Link>
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
              src="/mainleasemyndailogo.png" 
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
            Start analyzing leases<br />in minutes.
          </h1>
          <p className="text-stone-600 text-lg">
            Get AI-powered risk scoring, clause extraction, and actionable recommendations.
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
                backgroundColor: 'transparent',
                mixBlendMode: 'multiply'
              }}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 mb-2 heading-font">
              Create your account
            </h2>
            <p className="text-stone-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`flex items-center justify-center w-8 h-8 rounded-none text-sm font-medium ${
              step >= 1 ? "bg-blue-600 text-white" : "bg-stone-200 text-stone-500"
            }`}>
              1
            </div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? "bg-blue-600" : "bg-stone-200"}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-none text-sm font-medium ${
              step >= 2 ? "bg-blue-600 text-white" : "bg-stone-200 text-stone-500"
            }`}>
              2
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-none flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-stone-700 mb-2">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                    Work email
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
                  <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                  <p className="mt-2 text-xs text-stone-500">
                    Must be at least 8 characters
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (fullName && email && password.length >= 8) {
                      if (inviteInfo) {
                        // Skip step 2 for invites, go straight to signup
                        handleSignup({ preventDefault: () => {} } as React.FormEvent);
                      } else {
                        setStep(2);
                      }
                    }
                  }}
                  className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-none hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
                <p className="text-center text-sm text-stone-500">
                  Employer or employee?{" "}
                  <Link href="/employer/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign up for Document Management
                  </Link>
                </p>
              </>
            )}

            {step === 2 && !inviteInfo && (
              <>
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-stone-700 mb-2">
                    Organization name
                  </label>
                  <input
                    id="organizationName"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Acme Real Estate"
                    required
                  />
                  <p className="mt-2 text-xs text-stone-500">
                    Your company or team name
                  </p>
                </div>

                <div className="bg-stone-100 rounded-none p-4">
                  <h3 className="font-medium text-stone-900 mb-2">Free Plan</h3>
                  <ul className="text-sm text-stone-600 space-y-1">
                    <li>• 3 lease analyses per month</li>
                    <li>• AI-powered risk scoring</li>
                    <li>• Clause extraction & explanation</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white border border-stone-300 text-stone-700 font-medium py-3 px-4 rounded-none hover:bg-stone-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !organizationName}
                    className="flex-1 bg-blue-600 text-white font-medium py-3 px-4 rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {inviteInfo ? "Joining..." : "Creating..."}
                      </>
                    ) : (
                      inviteInfo ? "Join team" : "Create account"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="mt-8 text-center text-stone-400 text-sm">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <SignupFormInner />
    </Suspense>
  );
}
