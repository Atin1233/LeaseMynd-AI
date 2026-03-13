"use client";

import React from "react";
import Image from "next/image";

interface MacBookFrameProps {
  /** Optional image src for screen content (dashboard, lease analysis, etc.) */
  src?: string;
  alt?: string;
  /** Label shown when no image (placeholder) */
  title?: string;
  /** Use placeholder instead of image */
  placeholder?: boolean;
  className?: string;
}

/** MacBook-style browser frame for dashboard/lease analysis visuals */
const MacBookFrame: React.FC<MacBookFrameProps> = ({
  src,
  alt = "App screenshot",
  title = "Dashboard",
  placeholder = false,
  className = "",
}) => {
  return (
    <div
      className={`relative mx-auto w-full max-w-4xl ${className}`}
      aria-hidden
    >
      {/* MacBook base / chin */}
      <div className="rounded-b-2xl border-x-2 border-b-2 border-stone-300 bg-stone-200 pb-3 pt-2 shadow-xl">
        {/* Screen bezel */}
        <div className="mx-auto w-[95%] rounded-t-xl border-2 border-stone-400 bg-stone-300 px-1.5 pt-1.5 shadow-inner">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 rounded-t-lg border border-stone-400 bg-stone-100 px-3 py-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="ml-2 flex flex-1 items-center rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-500">
              leasemynd.com/dashboard
            </div>
          </div>
          {/* Screen content */}
          <div className="relative overflow-hidden rounded-b-lg border border-t-0 border-stone-400 bg-stone-50">
            <div className="aspect-video w-full min-h-[240px]">
              {!placeholder && src ? (
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                  <span className="text-stone-400 font-medium text-lg">
                    {title}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacBookFrame;
