import type { PropertyStatus } from "@/types/property";

interface DocumentsPanelProps {
  propertyStatus: PropertyStatus | null;
  isLoading: boolean;
}

export default function DocumentsPanel({ propertyStatus, isLoading }: DocumentsPanelProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Documents</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Box document insights</h2>
      <p className="mt-4 text-slate-600">{isLoading ? "Searching connected systems..." : propertyStatus?.box || "No Box data returned yet."}</p>
    </section>
  );
}
