"use client";

import { Zap } from "lucide-react";
import { Button } from "./ui/button";

export type AIModel = "gemini";

interface AIChatbotSelectorProps {
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
}

export function AIChatbotSelector({ selectedModel, onSelectModel }: AIChatbotSelectorProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-between h-10 border-gray-300 cursor-default"
      disabled
    >
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-blue-600" />
        <span className="text-sm">Gemini (Google AI)</span>
      </div>
    </Button>
  );
}
