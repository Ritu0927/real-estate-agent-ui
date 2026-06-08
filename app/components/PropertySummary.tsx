import type { PropertyStatus } from "@/types/property";

interface PropertySummaryProps {
  propertyStatus: PropertyStatus | null;
  isLoading: boolean;
}

export default function PropertySummary({ propertyStatus, isLoading }: PropertySummaryProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Property Summary</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Connected property overview</h2>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">Live</span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Address</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{isLoading ? "Searching connected systems..." : propertyStatus?.address || "—"}</p>
        </article>
        <article className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Box status</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{propertyStatus?.box ? "Connected" : "Pending"}</p>
        </article>
        <article className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Gmail status</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{propertyStatus?.gmail ? "Connected" : "Pending"}</p>
        </article>
      </div>
    </section>
  );
}
