"use client";

import Link from "next/link";
import clsx from "clsx";
import { FiCheck } from "react-icons/fi";
import type { IPricing } from "~/data/landing/types";

interface Props {
  tier: IPricing;
  highlight?: boolean;
}

const PricingColumn: React.FC<Props> = ({ tier, highlight }) => {
  const { name, price, features } = tier;

  return (
    <div
      className={clsx(
        "relative flex flex-col",
        highlight && "-mt-2 mb-2"
      )}
    >
      {/* Most Popular Badge */}
      {highlight && (
        <div className="mb-3 text-center text-xs font-medium text-slate-500">
          Most Popular
        </div>
      )}

      <div className={clsx(
        "flex-1 border-t pt-6",
        highlight ? "border-slate-900" : "border-slate-200"
      )}>
        <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          {typeof price === "number" ? `$${price}` : price}
          {typeof price === "number" && (
            <span className="text-base font-normal text-slate-500">/mo</span>
          )}
        </p>

        <Link
          href="/signup"
          className={clsx(
            "mt-4 block w-full rounded-md px-4 py-2 text-center text-sm font-medium transition-all",
            {
              "bg-slate-900 text-white hover:bg-slate-800": highlight,
              "border border-slate-200 text-slate-700 hover:border-slate-300": !highlight,
            }
          )}
        >
          {highlight ? "Start Free Trial" : "Get Started"}
        </Link>

        <ul className="mt-6 space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <FiCheck className={clsx(
                "mt-0.5 h-4 w-4 flex-shrink-0",
                highlight ? "text-slate-900" : "text-slate-400"
              )} />
              <span className="text-sm text-slate-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PricingColumn;
