"use client";

import React from "react";
import { howItWorksSteps } from "~/data/landing/howItWorks";
import SectionTitle from "./SectionTitle";

const HowItWorks: React.FC = () => {
  return (
    <div className="text-center">
      <SectionTitle
        title="How It Works"
        subtitle="Three simple steps to smarter lease analysis"
      />

      {/* Grid: 1 col on mobile, 3 cols on sm+ */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 lg:gap-10 relative">
        {/* Connecting line with arrow - only on large screens */}
        <div className="hidden lg:block absolute top-5 left-[25%] right-[25%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {howItWorksSteps.map((step, index) => (
          <div key={step.number} className="flex flex-col items-center text-center relative z-10">
            {/* Step indicator with number */}
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-700">
                {step.number}
              </span>
            </div>

            {/* Title */}
            <h3 className="mb-1 text-base font-semibold text-slate-900 sm:text-lg">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
