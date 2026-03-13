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
        title="Simple, transparent pricing"
        subtitle="Choose the plan that fits your needs. All plans include a free first analysis."
      />

      <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
