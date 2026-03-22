"use client";

import Link from "next/link";
import { ctaDetails } from "~/data/landing/cta";
import Container from "./Container";

const CTA: React.FC = () => {
  return (
    <section id="cta" className="relative overflow-hidden py-16 lg:py-24">
      {/* Match the site's purple gradient theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-white to-purple-50" />

      {/* Soft purple glow effects matching the site */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] bg-purple-200/50 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-[10%] h-[300px] w-[300px] bg-purple-300/40 rounded-full blur-2xl" />
      <div className="absolute top-0 left-[10%] h-[250px] w-[250px] bg-purple-100/60 rounded-full blur-3xl" />

      <Container className="relative z-10">
        <div className="flex flex-col items-center justify-center px-5 text-center">
          <h2 className="mb-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {ctaDetails.heading}
          </h2>
          <p className="mx-auto max-w-xl text-base text-slate-600">
            {ctaDetails.subheading}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group relative min-w-[160px] sm:min-w-[180px] overflow-hidden rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] text-center"
            >
              <span className="relative z-10">Start Free Analysis</span>
            </Link>
            <Link
              href="/login"
              className="min-w-[160px] sm:min-w-[180px] rounded-lg border border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-white text-center"
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
