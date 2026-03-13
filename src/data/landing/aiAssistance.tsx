import type { IBenefit } from "./types";
import {
  FiMessageCircle,
  FiEdit3,
  FiFileText,
} from "react-icons/fi";

export const aiAssistanceFeatures: IBenefit[] = [
  {
    title: "AI-Powered Tools",
    description:
      "Get tailored negotiation priorities, ask questions about your lease in plain English, and generate improved lease versions—all in one place.",
    imageSrc: "/landing-images/feature-negotiations.png",
    bullets: [
      {
        title: "What should I negotiate?",
        description: "AI-powered recommendations for key clauses to improve.",
        icon: <FiEdit3 size={26} />,
      },
      {
        title: "Ask about this lease",
        description: "Chat with AI about any clause or term in plain English.",
        icon: <FiMessageCircle size={26} />,
      },
      {
        title: "Generate Improved Lease",
        description: "Create a tenant-favorable version with one click.",
        icon: <FiFileText size={26} />,
      },
    ],
  },
];
