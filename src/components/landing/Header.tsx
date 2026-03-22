"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { HiOutlineXMark, HiBars3 } from "react-icons/hi2";
import { siteDetails } from "~/data/landing/siteDetails";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Check screen size on mount and resize - 640px breakpoint
    // Shows desktop nav on laptops/tablets in landscape, hamburger on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { text: "Product", url: "#features" },
    { text: "Resources", url: "#how-it-works" },
    { text: "Customers", url: "#testimonials" },
    { text: "Pricing", url: "#pricing" },
    { text: "AI", url: "#ai-assistance" },
    { text: "Contact", url: "/contact" },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-slate-100/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-14">
          {/* Logo - Left */}
          <Link href="/" className="flex-shrink-0 bg-transparent">
            <Image
              src={siteDetails.siteLogo}
              alt={siteDetails.siteName}
              width={140}
              height={35}
              className="h-6 w-auto bg-transparent"
              priority
            />
          </Link>

          {/* Desktop Navigation - Shows when not mobile */}
          {!isMobile && (
            <div className="flex flex-1 items-center justify-center space-x-1 lg:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.text}
                  href={item.url}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 rounded-md hover:bg-slate-100/50 whitespace-nowrap"
                >
                  {item.text}
                </Link>
              ))}
            </div>
          )}

          {/* Desktop Auth Buttons - Shows when not mobile */}
          {!isMobile && (
            <div className="flex items-center space-x-2 justify-end">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap px-3 py-1.5"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile menu button - Only shown when mobile */}
          {isMobile && (
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <HiOutlineXMark className="h-6 w-6" />
              ) : (
                <HiBars3 className="h-6 w-6" />
              )}
            </button>
          )}
        </nav>
      </div>

      {/* Mobile menu - Only shown when mobile and isOpen is true */}
      {isMobile && isOpen && (
        <div className="bg-white border-t border-slate-100 shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.text}
                href={item.url}
                className="block px-3 py-3 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.text}
              </Link>
            ))}
            <div className="border-t border-slate-200 my-3" />
            <Link
              href="/login"
              className="block px-3 py-3 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="block px-3 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-md text-center transition-all hover:opacity-90"
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
