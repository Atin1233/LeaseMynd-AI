"use client";

import Link from "next/link";
import { ctaDetails } from "~/data/landing/cta";
import Container from "./Container";

const CTA: React.FC = () => {
  return (
    <section id="cta" className="relative overflow-hidden py-16 lg:py-24">
      {/* Clean, minimal dark background */}
      <div className="absolute inset-0 bg-slate-900" />

      {/* Subtle dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

      {/* Soft glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] bg-slate-800/50 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-[20%] h-[200px] w-[200px] bg-slate-800/30 rounded-full blur-2xl" />

      <Container className="relative z-10">
        <div className="flex flex-col items-center justify-center px-5 text-center">
          <h2 className="mb-3 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            {ctaDetails.heading}
          </h2>
          <p className="mx-auto max-w-xl text-base text-slate-400">
            {ctaDetails.subheading}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="min-w-[160px] rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-slate-900 transition-all hover:bg-slate-100"
            >
              Start Free Analysis
            </Link>
            <Link
              href="/login"
              className="min-w-[160px] rounded-lg border border-slate-700 bg-transparent px-6 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-slate-500 hover:text-white"
            >
              Log in
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </Container>
    </section>
  );
};

export default CTA;
