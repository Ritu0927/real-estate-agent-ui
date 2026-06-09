"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import PropertySummary from "@/components/PropertySummary";
import DocumentsPanel from "@/components/DocumentsPanel";
import EmailPanel from "@/components/EmailPanel";
import RiskPanel from "@/components/RiskPanel";
import ChatPanel from "@/components/ChatPanel";
import { getPropertyStatus } from "../lib/api";
import { parseAgentResponse } from "@/lib/parseAgentResponse";
import type { PropertyStatus } from "@/types/property";

export default function Home() {
  const [address, setAddress] = useState("");
  const [propertyStatus, setPropertyStatus] = useState<PropertyStatus | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const restoredSearchRef = useRef(false);

  const saveSearchHistory = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setSearchHistory((prev) => {
      const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      window.localStorage.setItem("recent-property-searches", JSON.stringify(next));
      window.localStorage.setItem("active-property-search", trimmed);
      return next;
    });
  };

  const handleSearch = async (value = address) => {
    const trimmed = value.trim();

    if (!trimmed) {
      setErrorMessage("Please enter a property address to search.");
      return;
    }

    setErrorMessage(null);
    setIsSearching(true);

    try {
      const result = await getPropertyStatus(trimmed);
      setPropertyStatus(result);
      saveSearchHistory(trimmed);
    } catch {
      setErrorMessage("Unable to retrieve property information.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefresh = () => handleSearch(address);

  useEffect(() => {
    const saved = window.localStorage.getItem("recent-property-searches");
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {
        window.localStorage.removeItem("recent-property-searches");
      }
    }

    const activeSearch = window.localStorage.getItem("active-property-search");

    if (!restoredSearchRef.current && activeSearch && !propertyStatus) {
      restoredSearchRef.current = true;
      setAddress(activeSearch);
      void handleSearch(activeSearch);
    }
  }, [propertyStatus]);

  const parsedResponse = useMemo(() => {
    if (!propertyStatus) return null;

    return parseAgentResponse([propertyStatus.box, propertyStatus.gmail, propertyStatus.fub].filter(Boolean).join("\n\n"));
  }, [propertyStatus]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#e2e8f0_45%,_#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <Header />

        <section className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-200 backdrop-blur-sm">
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
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
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
            <PropertySummary propertyStatus={propertyStatus} parsedResponse={parsedResponse} isLoading={isSearching} />

            <div className="grid gap-6 md:grid-cols-2">
              <DocumentsPanel propertyStatus={propertyStatus} parsedResponse={parsedResponse} isLoading={isSearching} />
              <EmailPanel propertyStatus={propertyStatus} parsedResponse={parsedResponse} isLoading={isSearching} />
              <RiskPanel propertyStatus={propertyStatus} parsedResponse={parsedResponse} isLoading={isSearching} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <ChatPanel
              address={address}
              propertyStatus={propertyStatus}
              parsedResponse={parsedResponse}
              isLoading={isSearching}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
