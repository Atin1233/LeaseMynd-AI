"use client";

import React from "react";
import { aiAssistanceFeatures } from "~/data/landing/aiAssistance";
import SectionTitle from "./SectionTitle";

const AIAssistance: React.FC = () => {
  const feature = aiAssistanceFeatures[0]!;

  return (
    <div>
      <SectionTitle
        title="AI-Powered Assistance"
        subtitle="Tools that help you understand, negotiate, and improve your lease"
      />

      <div className="mt-12">
        {/* Grid layout: Text left, Image right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          {/* Text Content - Left */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              {feature.title}
            </h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              {feature.description}
            </p>

            {/* Feature bullets */}
            <ul className="space-y-4">
              {feature.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-slate-400 mt-0.5">
                    {bullet.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">
                      {bullet.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {bullet.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Image - Right */}
          <div className="relative">
            {/* Soft glow behind image */}
            <div className="absolute -inset-2 bg-slate-100 rounded-2xl blur-xl -z-10" />

            <div className="relative overflow-hidden rounded-lg border border-slate-200/60 shadow-sm">
              <img
                src={feature.imageSrc}
                alt={feature.title}
                className="w-full h-auto max-h-[350px] object-cover object-top"
                style={{ imageRendering: "-webkit-optimize-contrast" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistance;
