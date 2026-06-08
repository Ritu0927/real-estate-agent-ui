"use client";

interface SearchBarProps {
  address: string;
  onAddressChange: (value: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  isSearching: boolean;
  errorMessage?: string;
}

export default function SearchBar({
  address,
  onAddressChange,
  onSearch,
  onRefresh,
  isSearching,
  errorMessage,
}: SearchBarProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <label
          className="block text-sm font-medium text-slate-700 mb-2"
          htmlFor="property-search"
        >
          Search properties
        </label>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            id="property-search"
            type="text"
            value={address}
            onChange={(event) => onAddressChange(event.target.value)}
            placeholder="Search by address, owner, or MLS"
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={isSearching}
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSearching}
            >
              {isSearching ? "Searching connected systems..." : "Search"}
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSearching || !address.trim()}
            >
              Refresh
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className="text-sm text-red-600" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </div>
  );
}
