export default function Header() {
  return (
    <header className="mb-6 rounded-3xl bg-gradient-to-r from-white via-sky-50 to-indigo-50 p-6 text-slate-900 shadow-xl ring-1 ring-slate-200">
      <p className="text-xs uppercase tracking-[0.35em] text-sky-700">Property Intelligence</p>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Real Estate Operations Assistant</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
        Search any address, inspect Box documents, review Gmail activity, and keep Follow Up Boss tasks in view from one polished dashboard.
      </p>
    </header>
  );
}