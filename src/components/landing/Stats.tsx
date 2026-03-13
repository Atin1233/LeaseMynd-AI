"use client";

import { stats } from "~/data/landing/stats";

const Stats: React.FC = () => {
  return (
    <div className="relative">
      <div className="flex flex-row items-start justify-center gap-8 sm:gap-12 lg:gap-20">
        {stats.map((stat) => (
          <div key={stat.title} className="flex-1 max-w-[200px] flex flex-col items-center text-center">
            {/* Minimal icon - centered */}
            <div className="mb-2 text-slate-300">
              {stat.icon}
            </div>

            {/* Number/Title */}
            <h3 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {stat.title}
            </h3>

            {/* Description */}
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stats;
