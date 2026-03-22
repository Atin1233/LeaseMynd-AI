import type { IMenuItem, ISocials } from "~/data/landing/types";

export const footerDetails: {
  subheading: string;
  quickLinks: IMenuItem[];
  email: string;
  telephone: string;
  socials: ISocials;
} = {
  subheading:
    "AI-powered lease analysis that complements your attorney—so you save on legal review.",
  quickLinks: [
    { text: "Features", url: "#features" },
    { text: "Pricing", url: "/pricing" },
    { text: "Testimonials", url: "#testimonials" },
    { text: "Contact", url: "/contact" },
  ],
  email: "",
  telephone: "",
  socials: {
    linkedin: "https://www.linkedin.com",
    twitter: "https://twitter.com",
  },
};
