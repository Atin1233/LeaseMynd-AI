"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FiCheckCircle } from "react-icons/fi";
import { heroDetails } from "~/data/landing/hero";

const Hero: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative flex items-center justify-center px-4 sm:px-5 pb-0 pt-28 sm:pt-32 md:pt-36 lg:pt-40"
    >
      {/* Transparent - gradient shows through */}

      <div className="w-full max-w-6xl text-center">
        {/* Main Headline - Responsive text sizes */}
        <h1 className="mx-auto max-w-4xl font-semibold text-slate-900 text-3xl leading-[1.15] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
          {heroDetails.heading}
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base text-slate-500 sm:text-lg md:text-xl leading-relaxed px-2 sm:px-0">
          {heroDetails.subheading}
        </p>

        {/* CTA Buttons - Always side by side */}
        <div className="mx-auto mt-8 sm:mt-10 flex w-full sm:w-fit flex-row items-center justify-center gap-3 px-4 sm:px-0">
          <Link
            href="/signup"
            className="group relative w-auto min-w-[160px] sm:min-w-[180px] overflow-hidden rounded-lg bg-slate-900 px-5 sm:px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] text-center"
          >
            <span className="relative z-10">Start Free Analysis</span>
          </Link>
          <Link
            href="/login"
            className="w-auto min-w-[160px] sm:min-w-[180px] rounded-lg border border-slate-200 bg-white/80 backdrop-blur-sm px-5 sm:px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-white text-center"
          >
            Log in
          </Link>
        </div>

        {/* Trust Indicators - Always side by side */}
        <div className="mx-auto mt-6 sm:mt-8 flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <FiCheckCircle className="text-slate-400" size={14} />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiCheckCircle className="text-slate-400" size={14} />
            <span>Free analysis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiCheckCircle className="text-slate-400" size={14} />
            <span>Cancel anytime</span>
          </div>
        </div>

        {/* Product Screenshot - Responsive margins and sizing */}
        <div className="relative mx-auto mt-10 sm:mt-16 w-full max-w-5xl px-2 sm:px-0">
          {/* Soft glow effect */}
          <div className="absolute -inset-2 rounded-2xl bg-slate-200/50 blur-xl" />
          <div className="relative overflow-hidden rounded-lg border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <img
              src={heroDetails.centerImageSrc}
              alt="LeaseMynd Dashboard"
              className="w-full h-auto"
              style={{
                imageRendering: '-webkit-optimize-contrast',
                maxWidth: '100%',
                display: 'block'
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
