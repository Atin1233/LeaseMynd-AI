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
      className="relative flex items-center justify-center px-5 pb-0 pt-32 md:pt-40"
    >
      {/* Transparent - gradient shows through */}

      <div className="w-full max-w-6xl text-center">
        {/* Main Headline - Linear-inspired tighter tracking */}
        <h1 className="mx-auto max-w-4xl font-semibold text-slate-900 text-4xl leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
          {heroDetails.heading}
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500 md:text-xl leading-relaxed">
          {heroDetails.subheading}
        </p>

        {/* CTA Buttons - Softer, more refined */}
        <div className="mx-auto mt-10 flex w-fit flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group relative min-w-[180px] overflow-hidden rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
          >
            <span className="relative z-10">Start Free Analysis</span>
          </Link>
          <Link
            href="/login"
            className="min-w-[180px] rounded-lg border border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-white"
          >
            Log in
          </Link>
        </div>

        {/* Trust Indicators - More subtle */}
        <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-5 text-sm text-slate-400">
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

        {/* Product Screenshot - Subtle shadow, refined border */}
        <div className="relative mx-auto mt-16 w-full max-w-5xl">
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
