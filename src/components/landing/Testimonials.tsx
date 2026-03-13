"use client";

import React from "react";
import Image from "next/image";
import { testimonials } from "~/data/landing/testimonials";
import SectionTitle from "./SectionTitle";

const Testimonials: React.FC = () => {
  return (
    <div>
      <SectionTitle
        title="What early users are saying"
        subtitle="Feedback from commercial real estate professionals testing LeaseMynd"
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-3 relative">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="text-left relative">
            {/* Large quote mark decoration */}
            <div className="absolute -top-4 -left-2 text-6xl text-slate-100 font-serif select-none -z-10">
              &ldquo;
            </div>

            {/* Quote */}
            <p className="text-base text-slate-600 leading-relaxed">
              {testimonial.message}
            </p>

            {/* Author */}
            <div className="mt-6 flex items-center">
              <Image
                src={testimonial.avatar}
                alt={`${testimonial.name} avatar`}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {testimonial.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {testimonial.role}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
