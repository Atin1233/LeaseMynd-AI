"use client";

import PricingColumn from "~/components/landing/Pricing/PricingColumn";
import { tiers } from "~/data/landing/pricing";
import SectionTitle from "~/components/landing/SectionTitle";

const Pricing: React.FC = () => {
  return (
    <div className="relative">
      {/* Subtle background */}
      <div className="absolute -inset-10 bg-gradient-to-b from-slate-50/50 to-transparent -z-10 rounded-3xl" />

      <SectionTitle
        title="One plan. Three tiers."
        subtitle="Choose the plan that fits your needs. Start with a 14-day free trial."
      />

      {/* Grid: 1 col on mobile, fit cards on md (centered), 3 cols on lg */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-4 lg:gap-4">
        {tiers.map((tier, index) => (
          <PricingColumn
            key={tier.name}
            tier={tier}
            highlight={index === 1} // Middle tier (Team) is highlighted
          />
        ))}
      </div>
    </div>
  );
};

export default Pricing;
