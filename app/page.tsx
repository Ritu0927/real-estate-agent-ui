"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import PropertySummary from "@/components/PropertySummary";
import ChatPanel from "@/components/ChatPanel";
import { getPropertyStatus } from "../lib/api";
import { parsePropertyCaseResponse } from "@/lib/parseAgentResponse";
import type { PropertyStatus } from "@/types/property";

type LookupState = "idle" | "searching" | "pending" | "complete" | "error";

export default function Home() {
  const [address, setAddress] = useState("");
  const [propertyStatus, setPropertyStatus] = useState<PropertyStatus | null>(null);
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const [retryAfterMs, setRetryAfterMs] = useState(15000);
  const [attemptCount, setAttemptCount] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const restoredSearchRef = useRef(false);
  const isSearching = lookupState === "searching";

  const saveSearchHistory = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setSearchHistory((prev) => {
      const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      window.localStorage.setItem("recent-property-searches", JSON.stringify(next));
      window.localStorage.setItem("active-property-search", trimmed);
      return next;
    });
  }, []);

  const handleSearch = useCallback(async (value = address) => {
    const trimmed = value.trim();

    if (!trimmed) {
      setErrorMessage("Please enter a property address to search.");
      return;
    }

    setErrorMessage(null);
    setProgressMessage("Searching Box, Gmail, Google Drive, and Follow Up Boss...");
    setPendingAddress(trimmed);
    setLookupState("searching");
    setAttemptCount((count) => count + 1);

    try {
      const result = await getPropertyStatus(trimmed);

      if (result.status === "pending") {
        setPropertyStatus(null);
        setPendingAddress(result.address || trimmed);
        setProgressMessage(
          result.upstreamStatus
            ? `API Gateway returned ${result.upstreamStatus}. The Lambda may still be running, but this endpoint did not return a completed report to the dashboard.`
            : result.message || "The full Bedrock report is still running."
        );
        setRetryAfterMs(result.retryAfterMs || 15000);
        setLookupState("pending");
        saveSearchHistory(trimmed);
        return;
      }

      setPropertyStatus(result.propertyStatus);
      setProgressMessage(null);
      setPendingAddress(null);
      setLookupState("complete");
      saveSearchHistory(result.propertyStatus.address || trimmed);
    } catch (error) {
      setPropertyStatus(null);
      setProgressMessage(null);
      setLookupState("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to retrieve property information.");
    }
  }, [address, saveSearchHistory]);

  const handleRefresh = () => handleSearch(address);
  const handleRetry = () => handleSearch(pendingAddress || address);

  useEffect(() => {
    const saved = window.localStorage.getItem("recent-property-searches");
    let recentSearches: string[] = [];

    if (saved) {
      try {
        recentSearches = JSON.parse(saved);
        window.setTimeout(() => setSearchHistory(recentSearches), 0);
      } catch {
        window.localStorage.removeItem("recent-property-searches");
      }
    }

    const activeSearch = window.localStorage.getItem("active-property-search");
    const fallbackSearch = recentSearches[0];
    const searchToRestore = activeSearch || fallbackSearch;

    if (!restoredSearchRef.current && searchToRestore && !propertyStatus) {
      restoredSearchRef.current = true;
      window.setTimeout(() => {
        setAddress(searchToRestore);
      }, 0);
    }
  }, [propertyStatus]);

  const parsedResponse = useMemo(() => {
    if (!propertyStatus) return null;

    return parsePropertyCaseResponse(propertyStatus);
  }, [propertyStatus]);

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <Header />

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <SearchBar
            address={address}
            onAddressChange={setAddress}
            onSearch={() => handleSearch(address)}
            onRefresh={handleRefresh}
            isSearching={isSearching}
            errorMessage={errorMessage ?? undefined}
          />

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {searchHistory.length ? (
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-500">Recent searches</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {searchHistory.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setAddress(item);
                      handleSearch(item);
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <div className="mt-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {lookupState === "searching" || lookupState === "pending" ? (
              <section className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Generating transaction intelligence report...
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {progressMessage || "The full Bedrock property report can take around two minutes."}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Attempt {attemptCount}. {lookupState === "pending" ? `Wait about ${Math.round(retryAfterMs / 1000)} seconds, then retry. A real async backend needs a job ID/result endpoint to finish automatically.` : "Waiting for the current request."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={isSearching || !(pendingAddress || address).trim()}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSearching ? "Searching..." : "Retry now"}
                  </button>
                </div>
              </section>
            ) : null}

            <PropertySummary propertyStatus={propertyStatus} parsedResponse={parsedResponse} isLoading={false} />
          </div>

          <div className="col-span-12 lg:col-span-4">
            <ChatPanel
              address={address}
              propertyStatus={propertyStatus}
              parsedResponse={parsedResponse}
              isLoading={lookupState === "searching" || lookupState === "pending"}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
