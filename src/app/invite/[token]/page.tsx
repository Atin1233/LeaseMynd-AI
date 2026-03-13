"use client";
// @ts-nocheck - Supabase type inference issues
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function InviteAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired" | "already_accepted"
  >("loading");
  const [message, setMessage] = useState("");
  const [inviteData, setInviteData] = useState<{
    organizationName: string;
    inviterName: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link");
      setLoading(false);
      return;
    }

    handleInviteAcceptance();
  }, [token]);

  async function handleInviteAcceptance() {
    try {
      const supabase = createClient();

      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to signup with invite token
        router.push(`/signup?invite_token=${token}`);
        return;
      }

      // User is authenticated, accept the invite
      const response = await fetch(`/api/team/invite/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setInviteData(data.invite);
        setMessage("You've successfully joined the team!");

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        if (data.error?.includes("expired")) {
          setStatus("expired");
          setMessage("This invitation has expired. Please ask for a new invitation.");
        } else if (data.error?.includes("already accepted")) {
          setStatus("already_accepted");
          setMessage("This invitation has already been accepted.");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to accept invitation");
        }
      }
    } catch (error) {
      console.error("Invite acceptance error:", error);
      setStatus("error");
      setMessage("An error occurred while processing your invitation");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-stone-600">Processing your invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === "success" && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-stone-900 mb-2">
              Welcome to the Team!
            </h1>
            {inviteData && (
              <p className="text-stone-600 mb-4">
                You've been added to <strong>{inviteData.organizationName}</strong> as a{" "}
                <strong>{inviteData.role}</strong>.
              </p>
            )}
            <p className="text-stone-500 text-sm mb-6">{message}</p>
            <p className="text-stone-400 text-xs">Redirecting to dashboard...</p>
          </div>
        )}

        {status === "expired" && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-stone-900 mb-2">
              Invitation Expired
            </h1>
            <p className="text-stone-600 mb-6">{message}</p>
            <Link
              href="/dashboard"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === "already_accepted" && (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-stone-900 mb-2">
              Already Accepted
            </h1>
            <p className="text-stone-600 mb-6">{message}</p>
            <Link
              href="/dashboard"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-stone-900 mb-2">
              Error
            </h1>
            <p className="text-stone-600 mb-6">{message}</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-stone-200 text-stone-700 rounded-md hover:bg-stone-300 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleInviteAcceptance}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
