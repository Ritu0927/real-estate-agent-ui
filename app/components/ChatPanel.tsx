"use client";

import { useMemo, useState } from "react";
import { Bot, Send, Sparkles, User2 } from "lucide-react";
import type { ParsedAgentResponse } from "@/lib/parseAgentResponse";
import { answerPropertyQuestion, getStarterPrompt } from "@/lib/chatAssistant";
import type { PropertyStatus } from "@/types/property";

interface ChatPanelProps {
  address: string;
  propertyStatus: PropertyStatus | null;
  parsedResponse: ParsedAgentResponse | null;
  isLoading: boolean;
}

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

export default function ChatPanel({ address, propertyStatus, parsedResponse, isLoading }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const hasPropertyContext = Boolean(propertyStatus);

  const starterPrompt = useMemo(
    () => getStarterPrompt({ address, propertyStatus, parsedResponse }),
    [address, parsedResponse, propertyStatus]
  );

  const visibleMessages = messages.length
    ? messages
    : [{ role: "assistant" as const, text: starterPrompt }];

  const sendMessage = () => {
    const text = draft.trim();

    if (!text) return;

    const assistantReply = !hasPropertyContext && /\b(address|property|box|gmail|drive|follow up boss|fub|owner|name|search)\b/i.test(text)
      ? "Search a property first so I can answer from the live Box, Gmail, Google Drive, and Follow Up Boss data. Once a property is loaded, ask the same question again and I’ll answer from the case tracker."
      : answerPropertyQuestion(text, { address, propertyStatus, parsedResponse });

    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      {
        role: "assistant",
        text: assistantReply,
      },
    ]);
    setDraft("");
  };

  return (
    <aside className="h-full rounded-3xl bg-white p-5 text-slate-900 shadow-xl ring-1 ring-slate-200 lg:sticky lg:top-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-sky-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI assistant
          </p>
          <h2 className="mt-2 text-xl font-semibold">Property case chat</h2>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{isLoading ? "Searching" : "Live"}</span>
      </div>

      <div className="mt-4 flex h-[520px] flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {!hasPropertyContext ? (
            <article className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">No property loaded yet</p>
              <p className="mt-1">Use the search bar on the left to load an address. Then ask about Box, Gmail, Drive, Follow Up Boss, risks, or next steps.</p>
            </article>
          ) : null}
          {visibleMessages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                message.role === "user"
                  ? "ml-auto bg-sky-500 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                {message.role === "user" ? <User2 className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                {message.role}
              </div>
              {message.text}
            </article>
          ))}
        </div>

        <form
          className="mt-4 flex items-center gap-3 border-t border-slate-200 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about address, Box, Gmail, Drive, or FUB..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-600"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      </div>
    </aside>
  );
}