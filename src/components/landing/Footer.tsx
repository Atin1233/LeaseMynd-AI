"use client";

import Link from "next/link";
import React from "react";
import Image from "next/image";
import { siteDetails } from "~/data/landing/siteDetails";
import { footerDetails } from "~/data/landing/footer";
import { getPlatformIconByName } from "~/data/landing/utils";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-12">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={siteDetails.siteLogo}
                alt={siteDetails.siteName}
                width={140}
                height={36}
                className="h-5 sm:h-6 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {footerDetails.subheading}
            </p>
          </div>

          {/* Links - Stack on mobile, row on md+ */}
          <div className="flex flex-row gap-8 sm:gap-12">
            <div>
              <h4 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wider">Product</h4>
              <ul className="space-y-2">
                {footerDetails.quickLinks.map((link) => (
                  <li key={link.text}>
                    <Link
                      href={link.url}
                      className="text-xs sm:text-sm text-slate-500 transition-colors hover:text-slate-900"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/login"
                    className="text-xs sm:text-sm text-slate-500 transition-colors hover:text-slate-900"
                  >
                    Log in
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wider">Contact</h4>
              {footerDetails.email && (
                <a
                  href={`mailto:${footerDetails.email}`}
                  className="block text-xs sm:text-sm text-slate-500 transition-colors hover:text-slate-900"
                >
                  {footerDetails.email}
                </a>
              )}

              {footerDetails.socials && Object.keys(footerDetails.socials).length > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  {Object.keys(footerDetails.socials).map((platformName) => {
                    const url = footerDetails.socials[platformName];
                    if (platformName && url) {
                      return (
                        <Link
                          href={url}
                          key={platformName}
                          aria-label={platformName}
                          className="text-slate-400 transition-colors hover:text-slate-600"
                        >
                          {getPlatformIconByName(platformName)}
                        </Link>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} {siteDetails.siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
