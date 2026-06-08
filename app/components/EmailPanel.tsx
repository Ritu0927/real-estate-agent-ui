import { Mail, MessageSquareWarning, CircleDashed } from "lucide-react";
import type { PropertyStatus } from "@/types/property";
import type { ParsedAgentResponse } from "@/lib/parseAgentResponse";

interface EmailPanelProps {
  propertyStatus: PropertyStatus | null;
  parsedResponse: ParsedAgentResponse | null;
  isLoading: boolean;
}

export default function EmailPanel({ propertyStatus, parsedResponse, isLoading }: EmailPanelProps) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
      <div className="flex items-center gap-2 text-sky-700"><Mail className="h-4 w-4" /> <p className="text-sm font-semibold uppercase tracking-[0.25em]">Email Activity</p></div>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Gmail and follow-up communications</h2>
      <p className="mt-2 text-sm text-slate-500">Priority emails, pending responses, and unanswered communications.</p>

      <div className="mt-5 space-y-3">
        {(parsedResponse?.emails?.length ? parsedResponse.emails : ["No confirmed data found yet"]).map((item) => <article key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{item}</article>)}
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-amber-700"><MessageSquareWarning className="h-4 w-4" /> <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">What’s Remaining</h3></div>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {(parsedResponse?.remaining?.length ? parsedResponse.remaining : ["No confirmed data found yet"]).map((item) => <li key={item} className="flex gap-2"><CircleDashed className="mt-0.5 h-4 w-4 text-amber-600" /> <span>{item}</span></li>)}
        </ul>
      </div>

      <p className="mt-4 text-xs text-slate-400">{isLoading ? "Searching connected systems..." : propertyStatus?.gmail ? "Gmail summary available in the current response." : "No Gmail data returned yet."}</p>
    </section>
  );
}
