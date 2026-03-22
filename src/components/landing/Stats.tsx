"use client";

import { stats } from "~/data/landing/stats";

const Stats: React.FC = () => {
  return (
    <div className="relative">
      {/* Grid layout: 1 col on mobile, 3 cols on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-20">
        {stats.map((stat) => (
          <div key={stat.title} className="flex flex-col items-center text-center px-4">
            {/* Minimal icon - centered */}
            <div className="mb-2 text-slate-300">
              {stat.icon}
            </div>

            {/* Number/Title */}
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              {stat.title}
            </h3>

            {/* Description */}
            <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stats;
