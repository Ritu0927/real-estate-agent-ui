import { FileText, CheckCircle2, CircleDashed } from "lucide-react";
import type { PropertyStatus } from "@/types/property";
import type { ParsedAgentResponse } from "@/lib/parseAgentResponse";

interface DocumentsPanelProps {
  propertyStatus: PropertyStatus | null;
  parsedResponse: ParsedAgentResponse | null;
  isLoading: boolean;
}

export default function DocumentsPanel({ propertyStatus, parsedResponse, isLoading }: DocumentsPanelProps) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
      <div className="flex items-center gap-2 text-sky-700"><FileText className="h-4 w-4" /> <p className="text-sm font-semibold uppercase tracking-[0.25em]">Documents Found</p></div>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Box and Drive document view</h2>
      <p className="mt-2 text-sm text-slate-500">List of candidate files and document references found in the current response.</p>

      <div className="mt-5 space-y-3">
        {(parsedResponse?.documents?.length ? parsedResponse.documents : [{ name: "No confirmed data found yet", source: "—" }]).map((doc) => (
          <article key={`${doc.name}-${doc.source}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-700">{doc.source}{doc.date ? ` • ${doc.date}` : ""}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">What’s Done</h3></div>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {(parsedResponse?.done?.length ? parsedResponse.done : ["No confirmed data found yet"]).map((item) => <li key={item} className="flex gap-2"><CircleDashed className="mt-0.5 h-4 w-4 text-emerald-600" /> <span>{item}</span></li>)}
        </ul>
      </div>

      <p className="mt-4 text-xs text-slate-400">{isLoading ? "Searching connected systems..." : propertyStatus?.box ? "Box summary available in the current response." : "No Box data returned yet."}</p>
    </section>
  );
}
