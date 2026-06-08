import { Building2, Shield, Clock3, BadgeCheck, FileText, Layers3 } from "lucide-react";
import type { PropertyStatus } from "@/types/property";
import type { ParsedAgentResponse } from "@/lib/parseAgentResponse";

interface PropertySummaryProps {
  propertyStatus: PropertyStatus | null;
  parsedResponse: ParsedAgentResponse | null;
  isLoading: boolean;
}

export default function PropertySummary({ propertyStatus, parsedResponse, isLoading }: PropertySummaryProps) {
  const overviewItems = [
    { label: "Address", value: propertyStatus?.address || "—", icon: Building2 },
    { label: "Overall status", value: parsedResponse?.overallStatus || "Status not specified", icon: BadgeCheck },
    { label: "Transaction stage", value: parsedResponse?.transactionStage || "Stage not specified", icon: Layers3 },
    { label: "Risk level", value: parsedResponse?.riskLevel || "Risk not specified", icon: Shield },
    { label: "Last updated", value: parsedResponse?.lastUpdated || "Not provided", icon: Clock3 },
  ];

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Property Status Overview</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Professional case tracker overview</h2>
          <p className="mt-2 text-sm text-slate-500">Structured view of the latest property response, with source-backed bullet points and metadata warnings where needed.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live response</span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overviewItems.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sky-700"><Icon className="h-4 w-4" /> <span className="text-xs uppercase tracking-[0.2em]">{label}</span></div>
            <p className="mt-3 text-lg font-semibold text-slate-900">{isLoading ? "Searching connected systems..." : value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2 text-sky-700"><FileText className="h-4 w-4" /> <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">What’s Happening Now</h3></div>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {(parsedResponse?.activity?.length ? parsedResponse.activity : ["No confirmed data found yet"]).map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" /> <span>{item}</span></li>)}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2 text-sky-700"><Layers3 className="h-4 w-4" /> <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">Sources Reviewed</h3></div>
          <p className="mt-3 text-sm text-slate-500">Count of reviewed sources from the current response.</p>
          <div className="mt-3 flex flex-wrap gap-2">{(parsedResponse?.sources?.length ? parsedResponse.sources : ["Box", "Gmail", "Google Drive", "Follow Up Boss"]).map((item) => <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">{item}</span>)}</div>
          {parsedResponse?.warnings?.length ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">{parsedResponse.warnings.join(" ")}</p> : null}
        </article>
      </div>

      <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <summary className="cursor-pointer font-semibold text-slate-900">Raw Sources</summary>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{propertyStatus?.box || ""}\n\n{propertyStatus?.gmail || ""}\n\n{propertyStatus?.fub || ""}</pre>
      </details>
    </section>
  );
}
