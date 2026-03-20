"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirming your email...");

  useEffect(() => {
    const confirmAuth = async () => {
      const supabase = createClient();
      
      // Get the code from URL
      const code = searchParams.get("code");
      const token = searchParams.get("token");
      const type = searchParams.get("type");

      if (!code && !token) {
        setStatus("error");
        setMessage("Invalid or missing confirmation token.");
        return;
      }

      try {
        // If we have a code, exchange it for a session
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error("Confirmation error:", error);
            setStatus("error");
            setMessage(error.message || "Failed to confirm email.");
            return;
          }
        }

        setStatus("success");
        setMessage("Email confirmed successfully!");
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (err) {
        console.error("Confirmation error:", err);
        setStatus("error");
        setMessage("An unexpected error occurred.");
      }
    };

    confirmAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-semibold text-stone-900 mb-3">
              Confirming your email
            </h1>
            <p className="text-stone-500">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-semibold text-stone-900 mb-3">
              Email confirmed!
            </h1>
            <p className="text-stone-500 mb-6">{message}</p>
            <p className="text-stone-400 text-sm">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-stone-900 mb-3">
              Confirmation failed
            </h1>
            <p className="text-stone-500 mb-6">{message}</p>
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Go to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
