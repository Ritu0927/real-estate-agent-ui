import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Clock3,
  FileWarning,
  ListChecks,
  MapPin,
  MessageSquareText,
  SearchCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type React from "react";
import type {
  ParsedAgentResponse,
  RecommendedAction,
  TimelineEvent,
  TransactionProgressStep,
} from "@/lib/parseAgentResponse";
import type { PropertyStatus } from "@/types/property";

interface PropertySummaryProps {
  propertyStatus: PropertyStatus | null;
  parsedResponse: ParsedAgentResponse | null;
  isLoading: boolean;
}

const NO_DATA = "No confirmed data found.";

function display(value?: string | number | null) {
  if (value === 0) return "0";
  return value ? String(value) : NO_DATA;
}

function Card({
  title,
  icon: Icon,
  children,
  tone = "default",
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  tone?: "default" | "blue" | "amber" | "red" | "green";
}) {
  const toneClass = {
    default: "border-slate-200 bg-white",
    blue: "border-sky-200 bg-sky-50/70",
    amber: "border-amber-200 bg-amber-50/70",
    red: "border-rose-200 bg-rose-50/70",
    green: "border-emerald-200 bg-emerald-50/70",
  }[tone];

  const iconClass = {
    default: "text-slate-700",
    blue: "text-sky-700",
    amber: "text-amber-700",
    red: "text-rose-700",
    green: "text-emerald-700",
  }[tone];

  return (
    <section className={`rounded-xl border p-5 shadow-sm ${toneClass}`}>
      <div className="flex items-center gap-2 text-slate-950">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "blue" | "amber" | "red" | "slate" }) {
  const toneClass = {
    blue: "border-sky-200 bg-sky-50 text-sky-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-rose-200 bg-rose-50 text-rose-800",
    slate: "border-slate-200 bg-white text-slate-900",
  }[tone];

  return (
    <article className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </article>
  );
}

function Detail({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{display(value)}</p>
    </div>
  );
}

function Checklist({ items, tone = "blue" }: { items?: string[]; tone?: "blue" | "amber" | "red" | "green" }) {
  const visibleItems = items?.length ? items : [NO_DATA];
  const toneClass = {
    blue: "text-sky-600",
    amber: "text-amber-600",
    red: "text-rose-600",
    green: "text-emerald-600",
  }[tone];

  return (
    <ul className="space-y-2">
      {visibleItems.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
          <CheckCircle2 className={`mt-1 h-4 w-4 shrink-0 ${toneClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ActionList({ actions }: { actions?: RecommendedAction[] }) {
  if (!actions?.length) return <p className="text-sm text-slate-600">{NO_DATA}</p>;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {actions.map((action) => (
        <article key={action.label} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-semibold text-white">
              {action.urgency}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {action.timeframe}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{action.label}</p>
        </article>
      ))}
    </div>
  );
}

function TransactionProgress({ steps }: { steps: TransactionProgressStep[] }) {
  const statusClass = {
    complete: "border-emerald-200 bg-emerald-50 text-emerald-800",
    active: "border-sky-200 bg-sky-50 text-sky-800",
    blocked: "border-rose-200 bg-rose-50 text-rose-800",
    unknown: "border-slate-200 bg-white text-slate-500",
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ArrowUpRight className="h-4 w-4 text-slate-700" />
        <h2 className="text-base font-semibold text-slate-950">Transaction Progress</h2>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step) => (
          <article key={step.label} className={`rounded-xl border p-3 ${statusClass[step.status]}`}>
            <div className="flex items-center gap-2">
              {step.status === "complete" ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              <p className="text-sm font-semibold">{step.label}</p>
            </div>
            <p className="mt-2 text-xs capitalize opacity-80">{step.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TransactionTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-slate-700" />
        <h2 className="text-base font-semibold text-slate-950">Transaction Timeline</h2>
      </div>
      <div className="mt-5 space-y-4">
        {events.length ? events.map((event) => (
          <article key={`${event.date}-${event.event}`} className="grid gap-3 border-l border-slate-200 pl-4 md:grid-cols-[130px_1fr]">
            <p className="text-sm font-semibold text-slate-950">{event.date}</p>
            <p className="text-sm leading-6 text-slate-700">{event.event}</p>
          </article>
        )) : <p className="text-sm text-slate-600">{NO_DATA}</p>}
      </div>
    </section>
  );
}

export default function PropertySummary({ propertyStatus, parsedResponse, isLoading }: PropertySummaryProps) {
  const rawAnswer = parsedResponse?.rawText || propertyStatus?.answer || "";

  if (isLoading && !propertyStatus) {
    return (
      <section className="rounded-xl border border-sky-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-slate-700">
          <Sparkles className="h-5 w-5 animate-pulse text-sky-700" />
          <div>
            <p className="font-semibold">Generating transaction intelligence report...</p>
            <p className="mt-1 text-sm text-slate-500">Searching Box, Gmail, Google Drive, and Follow Up Boss.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!propertyStatus || !parsedResponse) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Enter an address to generate a transaction command center.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="h-4 w-4" />
              <p className="text-sm font-medium">Property Overview</p>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{display(propertyStatus.address || parsedResponse.address)}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {parsedResponse.reportSections.summary[0] || parsedResponse.activity[0] || "Executive transaction status generated from the Bedrock Agent report."}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-rose-700">Risk Score</p>
            <p className="mt-1 text-4xl font-semibold text-rose-700">{parsedResponse.riskScore}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <Detail label="Seller" value={parsedResponse.sellerClient} />
          <Detail label="Buyer" value={parsedResponse.buyer} />
          <Detail label="Stage" value={parsedResponse.stage || parsedResponse.transactionStatus} />
          <Detail label="Last Activity" value={parsedResponse.lastActivity} />
          <Detail label="Agent" value={parsedResponse.agent} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Open Items" value={parsedResponse.kpis.openItemsCount} tone="blue" />
        <Metric label="Missing Documents" value={parsedResponse.kpis.missingDocumentsCount} tone="amber" />
        <Metric label="Risks" value={parsedResponse.kpis.risksCount} tone="red" />
        <Metric label="Sources Reviewed" value={parsedResponse.kpis.sourcesReviewedCount} tone="slate" />
      </div>

      <TransactionProgress steps={parsedResponse.progress} />
      <TransactionTimeline events={parsedResponse.timeline} />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Summary" icon={MessageSquareText}>
          <Checklist items={parsedResponse.reportSections.summary.length ? parsedResponse.reportSections.summary : parsedResponse.activity} />
        </Card>

        <Card title="Key Findings" icon={ListChecks} tone="green">
          <Checklist items={parsedResponse.reportSections.keyFindings.length ? parsedResponse.reportSections.keyFindings : parsedResponse.activity} tone="green" />
        </Card>

        <Card title="Open Items" icon={AlertTriangle} tone="blue">
          <Checklist items={parsedResponse.reportSections.openItems.length ? parsedResponse.reportSections.openItems : parsedResponse.remaining} tone="blue" />
        </Card>

        <Card title="Missing Documents" icon={FileWarning} tone="amber">
          <Checklist items={parsedResponse.reportSections.missingDocuments.length ? parsedResponse.reportSections.missingDocuments : parsedResponse.missingDocuments} tone="amber" />
        </Card>

        <Card title="Risks" icon={ShieldAlert} tone="red">
          <Checklist items={parsedResponse.reportSections.risks.length ? parsedResponse.reportSections.risks : parsedResponse.risks} tone="red" />
        </Card>

        <Card title="Recommended Next Steps" icon={CheckCircle2}>
          <ActionList actions={parsedResponse.reportSections.recommendedNextSteps.length ? parsedResponse.reportSections.recommendedNextSteps : parsedResponse.recommendedNextSteps} />
        </Card>
      </div>

      <Card title="Sources Reviewed" icon={SearchCheck}>
        <Checklist items={parsedResponse.reportSections.sources.length ? parsedResponse.reportSections.sources : parsedResponse.sources} />
      </Card>

      <details className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-slate-950">View Full Report</summary>
        <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
          {rawAnswer || NO_DATA}
        </pre>
      </details>
    </div>
  );
}
