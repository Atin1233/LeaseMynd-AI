import {
  FiAlertTriangle,
  FiFileText,
  FiTrendingUp,
  FiBarChart2,
} from "react-icons/fi";
import type { IBenefit } from "~/data/landing/types";

export const benefits: IBenefit[] = [
  {
    title: "Risk scoring & clause analysis",
    description:
      "Get a 1–100 risk score and plain-English breakdown of 70+ lease provisions across 18 categories. Share the report with your attorney so they know exactly where to focus.",
    bullets: [
      {
        title: "Color-coded risk",
        description: "High-, medium-, and low-risk clauses at a glance.",
        icon: <FiAlertTriangle size={26} />,
      },
      {
        title: "Plain-English summaries",
        description: "No legalese—explain terms to stakeholders easily.",
        icon: <FiFileText size={26} />,
      },
      {
        title: "Executive summary",
        description: "3–5 key findings and recommendations upfront.",
        icon: <FiTrendingUp size={26} />,
      },
    ],
    imageSrc: "/landing-images/feature-risk-analysis.png",
  },
  {
    title: "Market benchmarking & comparisons",
    description:
      "Compare your lease terms against regional market standards for similar properties. See how your rent, escalation rates, and TI allowances stack up.",
    bullets: [
      {
        title: "Real market data",
        description: "Compare against 14+ benchmark markets including major US cities.",
        icon: <FiBarChart2 size={26} />,
      },
      {
        title: "Rent & CAM analysis",
        description: "See if your rates are favorable compared to market norms.",
        icon: <FiTrendingUp size={26} />,
      },
      {
        title: "Regional standards",
        description: "Data specific to Office, Retail, Industrial, and Medical properties.",
        icon: <FiFileText size={26} />,
      },
    ],
    imageSrc: "/landing-images/feature-ai-chat.png",
  },
  {
    title: "Team workspaces & sharing",
    description:
      "Collaborate with your team and share analyses with clients. Keep everyone aligned with centralized access to all lease reviews.",
    bullets: [
      {
        title: "Shared libraries",
        description: "Team-wide access to analyses and document templates.",
        icon: <FiFileText size={26} />,
      },
      {
        title: "Comments & discussions",
        description: "Discuss specific clauses and recommendations with team members.",
        icon: <FiAlertTriangle size={26} />,
      },
      {
        title: "White-label (Broker plan)",
        description: "Your branding and custom domain for client-facing reports.",
        icon: <FiBarChart2 size={26} />,
      },
    ],
    imageSrc: "/landing-images/feature-lease-generator.png",
  },
];
