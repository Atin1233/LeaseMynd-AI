"use client";

import Link from "next/link";

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lease-navy no-underline">
          <span className="text-xl">LeaseAI</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-sm font-medium text-stone-600 hover:text-lease-navy"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-stone-600 hover:text-lease-navy"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-prd bg-lease-orange px-4 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
