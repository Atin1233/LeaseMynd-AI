"use client";

import BenefitSection from "~/components/landing/Benefits/BenefitSection";
import { benefits } from "~/data/landing/benefits";
import SectionTitle from "~/components/landing/SectionTitle";

const sectionNumbers = ["01", "02", "03"];
const sectionTitles = [
  "Risk Analysis",
  "Market Intelligence", 
  "Team Collaboration"
];

const Benefits: React.FC = () => {
  return (
    <div id="features">
      <SectionTitle
        title="Everything you need for smarter lease decisions"
        subtitle="AI-powered analysis that helps you and your attorney focus on what matters"
      />

      <div className="mt-16 space-y-24">
        {benefits.map((item, index) => (
          <div key={index} className="relative">
            {/* Minimal Section Label */}
            <div className="mb-6 flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400">
                {sectionNumbers[index]}
              </span>
              <span className="text-xs font-medium text-slate-300">·</span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {sectionTitles[index]}
              </span>
            </div>

            {/* Alternating layout: even index = image right, odd index = image left */}
            <BenefitSection
              benefit={item}
              imagePosition={index % 2 === 0 ? "right" : "left"}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Benefits;
