"use client";

interface RiskGaugeProps {
  score: number;
  level: string;
}

export function RiskGauge({ score, level }: RiskGaugeProps) {
  const getColor = (score: number) => {
    if (score >= 80) return { main: "#16a34a", bg: "#dcfce7" };
    if (score >= 60) return { main: "#d97706", bg: "#fef3c7" };
    if (score >= 40) return { main: "#ea580c", bg: "#ffedd5" };
    return { main: "#dc2626", bg: "#fee2e2" };
  };

  const getLabel = (level: string) => {
    switch (level) {
      case "low":
        return "Low Risk";
      case "medium":
        return "Moderate";
      case "high":
        return "High Risk";
      case "critical":
        return "Critical";
      default:
        return "Unknown";
    }
  };

  const colors = getColor(score);
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#e7e5e4"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={colors.main}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-stone-900">{score}</span>
        </div>
      </div>

      {/* Label */}
      <div
        className="mt-4 px-3 py-1 rounded-none text-sm font-medium"
        style={{ backgroundColor: colors.bg, color: colors.main }}
      >
        {getLabel(level)}
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-stone-500 text-center max-w-[180px]">
        {score >= 80 && "Well-balanced agreement with favorable terms"}
        {score >= 60 && score < 80 && "Some terms may need attention"}
        {score >= 40 && score < 60 && "Significant issues to negotiate"}
        {score < 40 && "Major concerns requiring review"}
      </p>
    </div>
  );
}
