"use client";

import type { IBenefitBullet } from "~/data/landing/types";

const BenefitBullet: React.FC<IBenefitBullet> = ({
  title,
  description,
  icon,
}) => {
  return (
    <div className="mt-5 flex items-start gap-3">
      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-slate-400 mt-0.5">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-medium text-slate-900">{title}</h4>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
};

export default BenefitBullet;
