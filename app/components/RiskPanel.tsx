import { ShieldAlert, Briefcase, Lightbulb, BadgeAlert } from "lucide-react";
import type { PropertyStatus } from "@/types/property";
import type { ParsedAgentResponse } from "@/lib/parseAgentResponse";

interface RiskPanelProps {
  propertyStatus: PropertyStatus | null;
  parsedResponse: ParsedAgentResponse | null;
  isLoading: boolean;
}

export default function RiskPanel({ propertyStatus, parsedResponse, isLoading }: RiskPanelProps) {
  const riskTone = (value: string) => /high/i.test(value) ? "bg-rose-100 text-rose-700" : /medium/i.test(value) ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
      <div className="flex items-center gap-2 text-sky-700"><ShieldAlert className="h-4 w-4" /> <p className="text-sm font-semibold uppercase tracking-[0.25em]">Risks / Red Flags</p></div>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Risk, CRM, and next-step view</h2>
      <p className="mt-2 text-sm text-slate-500">Open risks, outstanding tasks, and recommended follow-up actions.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sky-700"><BadgeAlert className="h-4 w-4" /> <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">Risk level</h3></div>
          <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskTone(parsedResponse?.riskLevel || "")}`}>{parsedResponse?.riskLevel || "Risk not specified"}</span>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">{(parsedResponse?.risks?.length ? parsedResponse.risks : ["No confirmed data found yet"]).map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" /> <span>{item}</span></li>)}</ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sky-700"><Briefcase className="h-4 w-4" /> <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">CRM / Follow Up Boss</h3></div>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">{(parsedResponse?.crm?.length ? parsedResponse.crm : ["No confirmed data found yet"]).map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>

      <article className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sky-700"><Lightbulb className="h-4 w-4" /> <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">Recommended Next Steps</h3></div>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">{(parsedResponse?.nextSteps?.length ? parsedResponse.nextSteps : ["No confirmed data found yet"]).map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" /> <span>{item}</span></li>)}</ul>
      </article>

      <p className="mt-4 text-xs text-slate-400">{isLoading ? "Searching connected systems..." : propertyStatus?.fub ? "Follow Up Boss summary available in the current response." : "No Follow Up Boss data returned yet."}</p>
    </section>
  );
}
