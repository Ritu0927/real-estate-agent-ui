"use client";

import { useMemo, useState } from "react";
import { Bot, Loader2, Send, Sparkles, User2 } from "lucide-react";
import type { ParsedAgentResponse } from "@/lib/parseAgentResponse";
import { askBedrockAgent } from "@/lib/api";
import { answerFromLoadedReport } from "@/lib/chatAssistant";
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
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const hasPropertyContext = Boolean(propertyStatus);

  const starterPrompt = useMemo(() => {
    if (!propertyStatus) {
      return "Ask me anything. When a property is loaded, I will include that case context with your question.";
    }

    const status = parsedResponse?.transactionStatus || "status not confirmed";
    return `Loaded property: ${address || propertyStatus.address}. Current transaction status: ${status}. Ask any follow-up question and I will include this case context.`;
  }, [address, parsedResponse?.transactionStatus, propertyStatus]);

  const visibleMessages = messages.length
    ? messages
    : [{ role: "assistant" as const, text: starterPrompt }];

  const sendMessage = async () => {
    const text = draft.trim();

    if (!text || isSending) return;

    setDraft("");
    setNotice(null);
    setMessages((prev) => [...prev, { role: "user", text }]);

    if (!propertyStatus) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: isLoading
            ? "The property report is still generating. Once it loads, I can answer questions using the report context."
            : "Load a property report first, then I can answer questions about that transaction using the Bedrock report context.",
        },
      ]);
      return;
    }

    const localAnswer = answerFromLoadedReport(text, { address, propertyStatus, parsedResponse });

    if (localAnswer) {
      setMessages((prev) => [...prev, { role: "assistant", text: localAnswer }]);
      return;
    }

    setIsSending(true);

    try {
      const response = await askBedrockAgent({ question: text, propertyStatus });
      setMessages((prev) => [...prev, { role: "assistant", text: response.answer }]);
    } catch {
      setNotice("Unable to reach the Bedrock Agent right now.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I could not send that question to the Bedrock Agent. Please try again when the backend is available.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className="h-full rounded-lg bg-white p-5 text-slate-900 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold text-sky-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI assistant
          </p>
          <h2 className="mt-2 text-xl font-semibold">Bedrock Agent chat</h2>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {isLoading || isSending ? "Working" : "Ready"}
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        {hasPropertyContext
          ? `Property context included: ${propertyStatus?.address || address}`
          : isLoading
            ? "Waiting for the property report before attaching case context."
            : "Load a property report to attach transaction context."}
      </div>

      <div className="mt-4 flex h-[560px] flex-col rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-inner">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {notice ? (
            <article className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {notice}
            </article>
          ) : null}
          {visibleMessages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={`max-w-[92%] rounded-lg px-4 py-3 text-sm shadow-sm ${
                message.role === "user"
                  ? "ml-auto bg-sky-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold opacity-70">
                {message.role === "user" ? <User2 className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                {message.role === "user" ? "You" : "Agent"}
              </div>
              <p className="whitespace-pre-wrap">{message.text}</p>
            </article>
          ))}
          {isSending ? (
            <article className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
              <Loader2 className="h-4 w-4 animate-spin text-sky-700" />
              Asking Bedrock Agent...
            </article>
          ) : null}
        </div>

        <form
          className="mt-4 flex items-center gap-3 border-t border-slate-200 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask the Bedrock Agent anything..."
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
          <button
            type="submit"
            disabled={isSending || !draft.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </form>
      </div>
    </aside>
  );
}
