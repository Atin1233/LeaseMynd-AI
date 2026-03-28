"use client";

import Link from "next/link";
import React from "react";
import Image from "next/image";
import { siteDetails } from "~/data/landing/siteDetails";
import { footerDetails } from "~/data/landing/footer";
import { getPlatformIconByName } from "~/data/landing/utils";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content - 4 column grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={siteDetails.siteLogo}
                alt={siteDetails.siteName}
                width={160}
                height={40}
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-xs">
              {footerDetails.subheading}
            </p>

            {/* Social icons */}
            {footerDetails.socials && Object.keys(footerDetails.socials).length > 0 && (
              <div className="mt-6 flex items-center gap-4">
                {Object.keys(footerDetails.socials).map((platformName) => {
                  const url = footerDetails.socials[platformName];
                  if (platformName && url) {
                    return (
                      <Link
                        href={url}
                        key={platformName}
                        aria-label={platformName}
                        className="text-slate-400 transition-colors hover:text-purple-600"
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

          {/* Product Column */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-3">
              {footerDetails.quickLinks.map((link) => (
                <li key={link.text}>
                  <Link
                    href={link.url}
                    className="text-sm text-slate-500 transition-colors hover:text-purple-600"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Column */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Account
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/signup"
                  className="text-sm text-slate-500 transition-colors hover:text-purple-600"
                >
                  Sign up
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-slate-500 transition-colors hover:text-purple-600"
                >
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-slate-500 transition-colors hover:text-purple-600"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/help"
                  className="text-sm text-slate-500 transition-colors hover:text-purple-600"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${footerDetails.email}`}
                  className="text-sm text-slate-500 transition-colors hover:text-purple-600"
                >
                  {footerDetails.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-100">
          <p className="text-center text-sm text-slate-400">
            © {new Date().getFullYear()} {siteDetails.siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
