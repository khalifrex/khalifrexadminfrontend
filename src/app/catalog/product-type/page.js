"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProductTypes } from "@/app/api/productTypeApi";

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F2F4F7] text-[#6B7280]"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function ProductTypePage() {
  const [types, setTypes] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);

  const load = async () => {
    try {
      const data = await fetchProductTypes({ search: search.trim(), includeInactive });
      setTypes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  const loading = types === null && !error;

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-[#1B1F27]">Product types</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Define the product types sellers list against, and the variation themes they support.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Link
            href="/catalog/product-type/create"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#2F5D9F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F3F73]"
          >
            <span className="text-base leading-none">+</span> Add new product type
          </Link>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="rounded-md border border-[#D0D5DD] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]"
            />
            <button
              type="submit"
              className="rounded-md border border-[#D0D5DD] px-3 py-2 text-sm font-semibold text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
            >
              Search
            </button>
          </form>
          <label className="flex items-center gap-2 text-sm text-[#374151] ml-auto">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-[#D0D5DD]"
            />
            Show inactive
          </label>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white px-4 py-2">
          {loading && (
            <p className="py-6 text-center text-sm text-[#6B7280]">Loading product types…</p>
          )}
          {error && <p className="py-6 text-center text-sm text-[#B42318]">{error}</p>}
          {!loading && !error && (types || []).length === 0 && (
            <p className="py-6 text-center text-sm text-[#6B7280]">No product types yet.</p>
          )}
          {!loading &&
            !error &&
            (types || []).map((t) => (
              <Link
                key={t.productTypeId || t.name}
                href={`/catalog/product-type/${encodeURIComponent(t.name)}`}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-[#EEF0F3] last:border-b-0 hover:bg-[#F9FAFB] -mx-4 px-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[#1B1F27] truncate">
                      {t.displayName}
                    </span>
                    <span className="font-mono text-[11px] text-[#6B7280]">{t.name}</span>
                    <StatusBadge active={t.isActive} />
                  </div>
                  {!!t.variationThemes?.length && (
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                      {t.variationThemes.length} variation theme
                      {t.variationThemes.length === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs font-semibold text-[#2F5D9F]">Edit →</span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
