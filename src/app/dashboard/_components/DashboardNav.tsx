"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Upload,
  Settings,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users,
  CreditCard,
  Library,
  HelpCircle,
  BarChart3,
  FileStack,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

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

interface DashboardNavProps {
  user: User;
  profile: Profile | null;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function DashboardNav({
  user,
  profile,
  collapsed,
  onCollapsedChange,
}: DashboardNavProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const setCollapsed = (value: boolean) => {
    onCollapsedChange(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard-sidebar-collapsed", String(value));
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/library", label: "Library", icon: Library },
    { href: "/dashboard/portfolio", label: "Portfolio", icon: BarChart3 },
    { href: "/dashboard/templates", label: "Templates", icon: FileStack },
    { href: "/dashboard/collaboration", label: "Team", icon: Users },
    { href: "/dashboard/upload", label: "New Analysis", icon: Upload },
  ];

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 z-50 h-full flex flex-col bg-white border-r border-stone-200 transition-all duration-200 ease-in-out",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className={clsx(
          "flex flex-shrink-0 items-center justify-center border-b border-stone-100 transition-all duration-200",
          collapsed ? "h-24 px-2" : "h-32 px-4"
        )}
      >
        <img
          src="/leasemyndaiapplogo.png"
          alt="LeaseAI"
          className={clsx(
            "flex-shrink-0 object-contain",
            collapsed ? "h-16 w-16" : "h-28 w-28"
          )}
          style={{ backgroundColor: "transparent", mixBlendMode: "multiply" }}
        />
      </Link>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto pt-6 pb-4">
        <ul className="space-y-0.5 px-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-stone-100 text-stone-900"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span
                    className={clsx(
                      "overflow-hidden whitespace-nowrap transition-opacity duration-200",
                      collapsed ? "w-0 opacity-0" : "opacity-100"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section + collapse toggle */}
      <div className="flex flex-shrink-0 flex-col border-t border-stone-100">
        <div className="relative p-3" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-stone-50 transition-colors"
          >
            <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-stone-200 flex items-center justify-center text-stone-600 font-medium text-sm">
              {profile?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
            </div>
            <div
              className={clsx(
                "min-w-0 flex-1 overflow-hidden transition-opacity duration-200",
                collapsed ? "w-0 opacity-0" : "opacity-100"
              )}
            >
              <div className="truncate text-sm font-medium text-stone-900">
                {profile?.full_name || "User"}
              </div>
              <div className="truncate text-xs text-stone-500">
                {profile?.organizations?.name || "No organization"}
              </div>
            </div>
            <ChevronDown
              className={clsx(
                "h-4 w-4 flex-shrink-0 text-stone-400 transition-opacity duration-200",
                collapsed && "opacity-0"
              )}
            />
          </button>

          {dropdownOpen && (
            <div
              className={clsx(
                "absolute overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg w-64",
                collapsed
                  ? "left-full top-0 ml-2"
                  : "bottom-full left-0 right-0 mb-2"
              )}
            >
              <div className="border-b border-stone-100 p-4">
                <div className="text-sm font-medium text-stone-900">
                  {profile?.full_name || "User"}
                </div>
                <div className="text-xs text-stone-500">{user.email}</div>
                {profile?.organizations && (
                  <div className="mt-2 flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-stone-400" />
                    <span className="text-xs text-stone-600">
                      {profile.organizations.name}
                    </span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium capitalize text-blue-600">
                      {profile.organizations.plan}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2">
                <Link
                  href="/dashboard/team"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Users className="h-4 w-4" />
                  Team Settings
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <CreditCard className="h-4 w-4" />
                  Billing
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/dashboard/help"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <HelpCircle className="h-4 w-4" />
                  Help Center
                </Link>

                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center gap-2 border-t border-stone-100 py-3 text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
