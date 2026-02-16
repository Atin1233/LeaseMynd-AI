"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Loader2, User, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LeaseQAPanelProps {
  leaseId: string;
}

const SUGGESTED_QUESTIONS = [
  "What are the termination clauses?",
  "What should I negotiate?",
  "Summarize the rent and escalation terms.",
  "Are there any assignment or sublease restrictions?",
];

export function LeaseQAPanel({ leaseId }: LeaseQAPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lease-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId, question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error ?? "Something went wrong." },
        ]);
        setError(data.error ?? "Request failed");
        return;
      }
      setError(null);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer ?? "No answer." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to get an answer. Please try again." },
      ]);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="ask-ai" className="bg-white border border-stone-200 rounded-lg overflow-hidden mb-8 scroll-mt-24">
      <div className="border-b border-stone-200 bg-stone-50 px-5 py-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-stone-900 heading-font">
          Ask about this lease
        </h2>
      </div>
      <div className="p-4">
        {messages.length === 0 && (
          <p className="text-sm text-stone-500 mb-4">
            Ask questions in plain English. Answers are based on this lease&apos;s extracted text.
          </p>
        )}
        <div className="space-y-4 max-h-80 overflow-y-auto mb-4 min-h-[6rem]">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-stone-100 text-stone-800"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-stone-600" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              </div>
              <div className="bg-stone-100 rounded-lg px-4 py-2.5 text-stone-500 text-sm">
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInput(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this lease…"
            className="flex-1 border border-stone-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </form>
        {error && (
          <p className="text-xs text-red-600 mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
