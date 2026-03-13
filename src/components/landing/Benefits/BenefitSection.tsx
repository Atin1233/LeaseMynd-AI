"use client";

import BenefitBullet from "~/components/landing/Benefits/BenefitBullet";
import type { IBenefit } from "~/data/landing/types";

interface Props {
  benefit: IBenefit;
  imagePosition?: "left" | "right";
}

const BenefitSection: React.FC<Props> = ({ benefit, imagePosition = "right" }) => {
  const { title, description, bullets, imageSrc } = benefit;

  // Text always comes first in HTML, we use flex order to position it
  // imagePosition="right" → text first (default), image second
  // imagePosition="left" → we need to reverse so image shows first
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
      {/* Text Content */}
      <div className={imagePosition === "left" ? "lg:order-2" : "lg:order-1"}>
        <h3 className="text-2xl font-bold text-slate-900 md:text-3xl">
          {title}
        </h3>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          {description}
        </p>
        
        <div className="mt-6">
          {bullets.map((item, index) => (
            <BenefitBullet
              key={index}
              title={item.title}
              icon={item.icon}
              description={item.description}
            />
          ))}
        </div>
      </div>

      {/* Image */}
      <div className={imagePosition === "left" ? "lg:order-1" : "lg:order-2"}>
        <div className="relative">
          {/* Soft glow behind image */}
          <div className="absolute -inset-2 bg-slate-100 rounded-2xl blur-xl -z-10" />

          <div className="relative overflow-hidden rounded-lg border border-slate-200/60 shadow-sm">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-auto max-h-[350px] object-cover object-top"
                style={{ imageRendering: "-webkit-optimize-contrast" }}
              />
            ) : (
              <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <span className="text-slate-400 font-medium">{title}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenefitSection;
