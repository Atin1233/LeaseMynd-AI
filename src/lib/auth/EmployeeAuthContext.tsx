"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export type EmployeeUser = {
  userId: string;
  name: string;
  email: string;
  role: string;
};

type EmployeeAuthContextValue = {
  user: EmployeeUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const EmployeeAuthContext = createContext<EmployeeAuthContextValue | null>(null);

export function useEmployeeAuth() {
  const ctx = useContext(EmployeeAuthContext);
  if (!ctx) {
    throw new Error("useEmployeeAuth must be used within EmployeeAuthProvider");
  }
  return ctx;
}

export function EmployeeAuthProvider({
  children,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<EmployeeUser | null>(null);
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
      const res = await fetch("/api/employeeAuth", { method: "GET" });
      if (!res.ok) {
        setUser(null);
        router.push(redirectTo);
        return;
      }
      const json = (await res.json()) as { data?: EmployeeUser };
      if (json.data) {
        setUser(json.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Employee auth check failed:", err);
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

  const value: EmployeeAuthContextValue = isSignupPage
    ? { user: null, loading: false, error: null, refetch: async () => {} }
    : { user, loading, error, refetch: fetchAuth };

  if (!isSignupPage && loading) {
    return (
      <EmployeeAuthContext.Provider value={value}>
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
      </EmployeeAuthContext.Provider>
    );
  }

  if (!isSignupPage && !user && !loading) {
    return null;
  }

  return (
    <EmployeeAuthContext.Provider value={value}>
      {children}
    </EmployeeAuthContext.Provider>
  );
}
