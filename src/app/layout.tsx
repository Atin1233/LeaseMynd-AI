import "~/styles/globals.css";
import "@uploadthing/react/styles.css";
import { Analytics } from "@vercel/analytics/next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "~/components/ui/Toaster";

import { type Metadata } from "next";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "LeaseAI - AI-Powered Commercial Lease Analysis",
  description:
    "Analyze commercial leases in minutes with AI. Get risk scoring, clause-by-clause analysis, and actionable recommendations.",
  icons: [{ rel: "icon", url: "favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={`${dmSans.className} bg-stone-50 text-stone-900 antialiased min-h-screen`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
