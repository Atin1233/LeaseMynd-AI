"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export type EmployerUser = {
  userId: string;
  name: string;
  email: string;
  role: string;
};

type EmployerAuthContextValue = {
  user: EmployerUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const EmployerAuthContext = createContext<EmployerAuthContextValue | null>(null);

export function useEmployerAuth() {
  const ctx = useContext(EmployerAuthContext);
  if (!ctx) {
    throw new Error("useEmployerAuth must be used within EmployerAuthProvider");
  }
  return ctx;
}

export function EmployerAuthProvider({
  children,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<EmployerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSignupPage = pathname?.includes("/signup") ?? false;

  const fetchAuth = async () => {
    if (isSignupPage) {
      setLoading(false);
      setUser(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/employerAuth", { method: "GET" });
      if (res.status === 300) {
        router.push("/employee/pending-approval");
        return;
      }
      if (!res.ok) {
        setUser(null);
        router.push(redirectTo);
        return;
      }
      const json = (await res.json()) as { data?: EmployerUser };
      if (json.data) {
        setUser(json.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Employer auth check failed:", err);
      setError("Authentication failed");
      setUser(null);
      router.push(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAuth();
  }, [pathname, isSignupPage, redirectTo]);

  const value: EmployerAuthContextValue = isSignupPage
    ? { user: null, loading: false, error: null, refetch: async () => {} }
    : { user, loading, error, refetch: fetchAuth };

  if (!isSignupPage && loading) {
    return (
      <EmployerAuthContext.Provider value={value}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--stone-50, #fafaf9)",
          }}
        >
          <p>Loading...</p>
        </div>
      </EmployerAuthContext.Provider>
    );
  }

  if (!isSignupPage && !user && !loading) {
    return null;
  }

  return (
    <EmployerAuthContext.Provider value={value}>
      {children}
    </EmployerAuthContext.Provider>
  );
}
