"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  fetchBrandRegistrations,
  fetchBrandRegistrationCounts,
} from "@/app/api/brandRegistryReviewApi";

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
  { value: "all", label: "All" },
];

function StatusBadge({ status }) {
  const tones = {
    pending: "bg-[#FEF3C7] text-[#92400E]",
    approved: "bg-[#DCFCE7] text-[#15803D]",
    rejected: "bg-[#FEE2E2] text-[#B42318]",
    suspended: "bg-[#F2F4F7] text-[#6B7280]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[status] || tones.pending}`}
    >
      {status}
    </span>
  );
}

export default function BrandRegistrationsPage() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState(null);

  const requestKey = `${status}:${page}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });

  const load = useCallback(() => {
    fetchBrandRegistrations({ status, page })
      .then((body) => setResult({ key: requestKey, data: body, error: null }))
      .catch((err) => setResult({ key: requestKey, data: null, error: err.message }));
  }, [status, page, requestKey]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchBrandRegistrationCounts()
      .then(setCounts)
      .catch(() => {});
  }, [result.key]);

  const body = result.key === requestKey ? result.data : null;
  const error = result.key === requestKey ? result.error : null;
  const brands = body?.data || [];
  const pagination = body?.pagination;
  const loading = body === null && error === null;

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-[#1B1F27]">Brand registrations</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Review trademark-based brand enrollments — approve, reject, suspend, or reinstate.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => {
            const count = counts?.[t.value];
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setStatus(t.value);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 ${
                  status === t.value
                    ? "bg-[#2F5D9F] text-white"
                    : "bg-white border border-[#D0D5DD] text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
                }`}
              >
                {t.label}
                {!!count && t.value !== "all" && (
                  <span
                    className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 py-0.5 ${
                      status === t.value ? "bg-white/20 text-white" : "bg-[#FEF3C7] text-[#92400E]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white px-4 py-2">
          {loading && (
            <p className="py-6 text-center text-sm text-[#6B7280]">Loading brand registrations…</p>
          )}
          {error && <p className="py-6 text-center text-sm text-[#B42318]">{error}</p>}
          {!loading && !error && brands.length === 0 && (
            <p className="py-6 text-center text-sm text-[#6B7280]">No brands in this status.</p>
          )}
          {!loading &&
            !error &&
            brands.map((b) => (
              <div
                key={b._id}
                className="flex items-center gap-3 py-3 border-b border-[#EEF0F3] last:border-b-0"
              >
                {b.logo?.url ? (
                  <Image
                    src={b.logo.url}
                    alt={b.brandName}
                    width={36}
                    height={36}
                    className="h-9 w-9 object-cover rounded-md border border-[#E4E7EC] shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-md bg-[#F2F4F7] shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-[#1B1F27]">{b.brandName}</span>
                    <StatusBadge status={b.approvalStatus} />
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5 truncate">
                    {b.ownerId?.fullName || "Unknown owner"} · {b.ownerId?.email || "no email"} ·{" "}
                    {b.trademarkStatus} {b.trademarkType?.replace(/_/g, " ")}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    Submitted {new Date(b.createdAt).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/brand-registrations/${b._id}`}
                  className="shrink-0 rounded-md border border-[#D0D5DD] px-3 py-1.5 text-xs font-semibold text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
                >
                  Review →
                </Link>
              </div>
            ))}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-[#D0D5DD] px-3 py-1.5 text-xs font-semibold text-[#374151] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-[#6B7280]">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-[#D0D5DD] px-3 py-1.5 text-xs font-semibold text-[#374151] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
