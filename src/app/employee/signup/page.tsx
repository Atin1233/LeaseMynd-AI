"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "~/lib/supabase/client";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function EmployeeSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [employeePasskey, setEmployeePasskey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
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

    const res = await fetch("/api/signup/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supabase_user_id: authData.user.id,
        name,
        email,
        companyName,
        employeePasskey,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to complete signup. Please try again.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    if (authData.session) {
      router.push("/employee/pending-approval");
      router.refresh();
    } else {
      router.push("/login?redirect=/employee/pending-approval");
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
            Account created
          </h1>
          <p className="text-stone-500 mb-6">
            Your employee account has been created. Awaiting administrator
            approval.
          </p>
          <Link
            href="/login?redirect=/employee/pending-approval"
            className="inline-block mt-8 text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-stone-50 p-12 flex-col">
        <div className="w-full flex items-center justify-center mt-20 mb-8">
          <Link href="/" className="flex justify-center w-3/4">
            <img
              src="/mainleasemyndailogo.png"
              alt="LeaseAI"
              className="w-full h-auto object-contain max-w-full"
              style={{ backgroundColor: "transparent", mixBlendMode: "multiply" }}
            />
          </Link>
        </div>
        <div className="mt-auto">
          <h1 className="text-4xl font-semibold text-stone-900 mb-4 heading-font leading-tight">
            Employee signup
          </h1>
          <p className="text-stone-600 text-lg">
            Join your company to access documents and collaboration tools.
          </p>
        </div>
        <div className="text-stone-400 text-sm mt-auto">
          © 2026 LeaseAI. All rights reserved.
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-10 w-full">
            <img
              src="/mainleasemyndailogo.png"
              alt="LeaseAI"
              className="w-3/4 h-auto object-contain max-w-full"
              style={{ backgroundColor: "transparent", mixBlendMode: "multiply" }}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 mb-2 heading-font">
              Create employee account
            </h2>
            <p className="text-stone-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-none text-sm font-medium ${
                step >= 1
                  ? "bg-blue-600 text-white"
                  : "bg-stone-200 text-stone-500"
              }`}
            >
              1
            </div>
            <div
              className={`flex-1 h-0.5 ${
                step >= 2 ? "bg-blue-600" : "bg-stone-200"
              }`}
            />
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-none text-sm font-medium ${
                step >= 2
                  ? "bg-blue-600 text-white"
                  : "bg-stone-200 text-stone-500"
              }`}
            >
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
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-stone-700 mb-2"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-stone-700 mb-2"
                  >
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  onClick={() =>
                    name && email && password.length >= 8 && setStep(2)
                  }
                  disabled={!name || !email || password.length < 8}
                  className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-none hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-stone-700 mb-2"
                  >
                    Company name
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Acme Corp"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="employeePasskey"
                    className="block text-sm font-medium text-stone-700 mb-2"
                  >
                    Employee passkey
                  </label>
                  <input
                    id="employeePasskey"
                    type="password"
                    value={employeePasskey}
                    onChange={(e) => setEmployeePasskey(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                  />
                  <p className="mt-2 text-xs text-stone-500">
                    Get this from your company administrator
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white border border-stone-300 text-stone-700 font-medium py-3 px-4 rounded-none hover:bg-stone-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading || !companyName || !employeePasskey
                    }
                    className="flex-1 bg-blue-600 text-white font-medium py-3 px-4 rounded-none hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create account"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="mt-6 text-center">
            <Link
              href="/employer/signup"
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              Sign up as employer instead
            </Link>
          </p>

          <p className="mt-4 text-center text-stone-400 text-sm">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
