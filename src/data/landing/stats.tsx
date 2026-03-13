import { BsClock, BsListCheck, BsBuilding } from "react-icons/bs";
import type { IStats } from "~/data/landing/types";

export const stats: IStats[] = [
  {
    title: "Under 5 min",
    icon: <BsClock size={32} className="text-blue-500" />,
    description: "Most lease analyses complete quickly, with a maximum of 5 minutes.",
  },
  {
    title: "70+",
    icon: <BsListCheck size={32} className="text-purple-500" />,
    description: "Lease provisions analyzed across 18 categories.",
  },
  {
    title: "Real Data",
    icon: <BsBuilding size={32} className="text-blue-500" />,
    description: "Compare against market benchmarks for major US markets.",
  },
];
