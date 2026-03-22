import type { IMenuItem } from "~/data/landing/types";

export const menuItems: IMenuItem[] = [
  { text: "Product", url: "#features" },
  { text: "Resources", url: "#how-it-works" },
  { text: "Customers", url: "#testimonials" },
  { text: "Pricing", url: "#pricing" },
  { text: "Now", url: "#ai-assistance" },
  { text: "Contact", url: "/contact" },
];

export const navRightItems = [
  { text: "Log in", url: "/login" },
  { text: "Sign up", url: "/signup", isButton: true },
];
