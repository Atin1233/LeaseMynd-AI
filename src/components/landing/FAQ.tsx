"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { BiMinus, BiPlus } from "react-icons/bi";
import { FiHelpCircle } from "react-icons/fi";
import SectionTitle from "~/components/landing/SectionTitle";
import { faqs } from "~/data/landing/faq";
import { footerDetails } from "~/data/landing/footer";

const FAQ: React.FC = () => {
  return (
    <div id="faq" className="text-center relative">
      {/* Subtle help icon decoration */}
      <div className="absolute -top-8 right-[10%] opacity-5 hidden lg:block">
        <FiHelpCircle className="h-32 w-32" />
      </div>

      <SectionTitle
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about LeaseMynd"
      />

      {/* Centered Accordion */}
      <div className="mt-10 mx-auto max-w-2xl text-left" suppressHydrationWarning>
        {faqs.map((faq, index) => (
          <Disclosure key={index}>
            {({ open }) => (
              <div className="border-b border-slate-200 group">
                <DisclosureButton
                  className="flex w-full items-center justify-between py-4 text-left"
                  suppressHydrationWarning
                >
                  <span className="pr-4 text-sm font-medium text-slate-900 group-hover:text-slate-700 transition-colors">
                    {faq.question}
                  </span>
                  <div className="text-slate-400">
                    {open ? (
                      <BiMinus className="h-4 w-4" />
                    ) : (
                      <BiPlus className="h-4 w-4" />
                    )}
                  </div>
                </DisclosureButton>
                <DisclosurePanel className="pb-4">
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {faq.answer}
                  </p>
                </DisclosurePanel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>

      {/* Contact link centered */}
      <div className="mt-8">
        <p className="text-xs text-slate-400">Still have questions?</p>
        {footerDetails.email && (
          <a
            href={`mailto:${footerDetails.email}`}
            className="mt-1 block text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            {footerDetails.email}
          </a>
        )}
      </div>
    </div>
  );
};

export default FAQ;
