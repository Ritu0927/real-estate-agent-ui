import type { PropertyStatus } from "@/types/property";

interface EmailPanelProps {
  propertyStatus: PropertyStatus | null;
  isLoading: boolean;
}

export default function EmailPanel({ propertyStatus, isLoading }: EmailPanelProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Email Activity</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Gmail activity view</h2>
      <p className="mt-4 text-slate-600">{isLoading ? "Searching connected systems..." : propertyStatus?.gmail || "No Gmail data returned yet."}</p>
    </section>
  );
}
