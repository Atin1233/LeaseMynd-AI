"use client";

import { useState, useEffect } from "react";
import { DashboardNav } from "./DashboardNav";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  organizations: {
    id: string;
    name: string;
    plan: string;
  } | null;
}

interface DashboardShellProps {
  user: User;
  profile: Profile | null;
  children: React.ReactNode;
}

const STORAGE_KEY = "dashboard-sidebar-collapsed";

export function DashboardShell({ user, profile, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const handleCollapsedChange = (value: boolean) => {
    setCollapsed(value);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardNav
        user={user}
        profile={profile}
        collapsed={collapsed}
        onCollapsedChange={handleCollapsedChange}
      />
      <main
        className={`min-h-screen transition-[margin] duration-200 ease-in-out ${
          collapsed ? "ml-16" : "ml-56"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
