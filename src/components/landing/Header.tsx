"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { HiOutlineXMark, HiBars3 } from "react-icons/hi2";
import { siteDetails } from "~/data/landing/siteDetails";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { text: "Product", url: "#features" },
    { text: "Resources", url: "#how-it-works" },
    { text: "Customers", url: "#testimonials" },
    { text: "Pricing", url: "#pricing" },
    { text: "Now", url: "#ai-assistance" },
    { text: "Contact", url: "mailto:contact@leasemynd.com" },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-slate-100/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center h-14">
          {/* Logo - Left */}
          <Link href="/" className="flex-shrink-0 w-32">
            <Image
              src={siteDetails.siteLogo}
              alt={siteDetails.siteName}
              width={140}
              height={35}
              className="h-6 w-auto"
              priority
            />
          </Link>

          {/* Center Navigation */}
          <div className="flex-1 flex items-center justify-center space-x-1 md:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.text}
                href={item.url}
                className="text-xs md:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 rounded-md hover:bg-slate-100/50 whitespace-nowrap"
              >
                {item.text}
              </Link>
            ))}
          </div>

          {/* Auth Buttons - Right */}
          <div className="flex-shrink-0 flex items-center space-x-2 w-32 justify-end">
            <Link
              href="/login"
              className="text-xs md:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs md:text-sm font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile menu button - Only show on small screens */}
          <button
            onClick={toggleMenu}
            className="sm:hidden ml-4 inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
          >
            {isOpen ? (
              <HiOutlineXMark className="h-6 w-6" />
            ) : (
              <HiBars3 className="h-6 w-6" />
            )}
          </button>
        </nav>
      </div>

      {/* Mobile menu - Only shows when isOpen is true */}
      {isOpen && (
        <div className="sm:hidden bg-white border-t border-slate-100">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.text}
                href={item.url}
                className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {item.text}
              </Link>
            ))}
            <div className="border-t border-slate-200 my-2" />
            <Link
              href="/login"
              className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="block px-3 py-2 text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
