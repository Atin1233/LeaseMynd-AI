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

      <div className="mt-10 flex flex-row items-start justify-center gap-4 sm:gap-6 lg:gap-10 relative">
        {/* Connecting line with arrow */}
        <div className="hidden lg:block absolute top-5 left-[25%] right-[25%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {howItWorksSteps.map((step, index) => (
          <div key={step.number} className="flex-1 max-w-[220px] text-center relative z-10">
            {/* Step indicator with number */}
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-700">
                {step.number}
              </span>
            </div>

            {/* Title */}
            <h3 className="mb-1 text-sm font-semibold text-slate-900 sm:text-base">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-xs text-slate-500 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
