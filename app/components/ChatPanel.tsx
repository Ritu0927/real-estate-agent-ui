"use client";

import { useState } from "react";

export default function ChatPanel() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me anything about the property, documents, email activity, or follow-up tasks.",
    },
  ]);

  const sendMessage = () => {
    const text = draft.trim();

    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      {
        role: "assistant",
        text: "I’m reviewing the latest property insights now. Try asking for document highlights, open follow-ups, or recent email activity.",
      },
    ]);
    setDraft("");
  };

  return (
    <aside className="h-full rounded-3xl bg-white p-5 text-slate-900 shadow-xl ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-sky-700">AI assistant</p>
          <h2 className="mt-2 text-xl font-semibold">AI Chat</h2>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Live</span>
      </div>

      <div className="mt-4 flex h-[520px] flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                message.role === "user"
                  ? "ml-auto bg-sky-500 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              {message.text}
            </article>
          ))}
        </div>

        <form
          className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4"
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
            placeholder="Type a question and press Enter..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
          <button
            type="submit"
            className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-600"
          >
            Send
          </button>
        </form>
      </div>
    </aside>
  );
}