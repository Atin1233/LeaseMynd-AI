import { Message } from "../../page";
import { Document } from "../../page";

export interface VoiceChatProps {
    messages: Message[];
    onSendMessage: (content: string) => void;
    onEndCall?: () => void;
    isBuddy?: boolean;
    documents?: Document[];
    avatarUrl?: string;
  }
  
export type CallState = "connected" | "listening" | "speaking" | "muted";