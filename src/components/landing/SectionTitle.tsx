"use client";

import React from "react";

interface SectionTitleProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactElement;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, children }) => {
  // If children provided, use the old behavior
  if (children) {
    return React.cloneElement(children, {
      className:
        ((children.props as { className?: string }).className ?? "") +
        " text-3xl font-bold leading-tight lg:text-5xl",
    } as React.HTMLAttributes<HTMLElement>);
  }

  // New behavior with title and subtitle
  return (
    <div className="text-center">
      {title && (
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-500 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
