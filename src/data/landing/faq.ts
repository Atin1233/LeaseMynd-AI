import type { IFAQ } from "~/data/landing/types";
import { siteDetails } from "~/data/landing/siteDetails";

export const faqs: IFAQ[] = [
  {
    question: `Does ${siteDetails.siteName} replace my attorney?`,
    answer:
      "No. LeaseMynd complements your attorney. We flag risks and negotiation points so your counsel knows exactly what to look for—reducing billable hours while keeping legal judgment where it belongs.",
  },
  {
    question: "How fast is the analysis?",
    answer:
      "Most leases are analyzed in about 5 minutes. You get a risk score, clause-by-clause breakdown, and negotiation suggestions you can share with your attorney before the first meeting.",
  },
  {
    question: "What file formats do you support?",
    answer: "We support PDF uploads. Drag and drop your lease; our AI extracts text and runs analysis. No manual data entry.",
  },
  {
    question: "Can my team collaborate on analyses?",
    answer:
      "Yes. Team and Broker plans include workspaces, shared libraries, and comments. Brokers can use white-label branding and secure client sharing.",
  },
  {
    question: "Is my lease data secure?",
    answer:
      "Yes. Documents are encrypted in transit and at rest. We don’t train on your data. You can export or delete your data anytime (GDPR-compliant).",
  },
];
