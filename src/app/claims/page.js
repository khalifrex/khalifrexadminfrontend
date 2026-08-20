"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchAtozClaims, fetchSafeTClaims } from "@/app/api/claimsApi";

const ATOZ_STATUS_TABS = [
  { value: "OPEN", label: "Open" },
  { value: "UNDER_SELLER_REVIEW", label: "Seller reviewing" },
  { value: "UNDER_ADMIN_REVIEW", label: "Needs decision" },
  { value: "GRANTED", label: "Granted" },
  { value: "DENIED", label: "Denied" },
  { value: "all", label: "All" },
];
const SAFET_STATUS_TABS = [
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "APPROVED", label: "Approved" },
  { value: "DENIED", label: "Denied" },
  { value: "all", label: "All" },
];

function StatusBadge({ status }) {
  const tones = {
    OPEN: "bg-[#FEF3C7] text-[#92400E]",
    UNDER_SELLER_REVIEW: "bg-[#FEF3C7] text-[#92400E]",
    UNDER_ADMIN_REVIEW: "bg-[#DBEAFE] text-[#1D4ED8]",
    UNDER_REVIEW: "bg-[#DBEAFE] text-[#1D4ED8]",
    GRANTED: "bg-[#DCFCE7] text-[#15803D]",
    APPROVED: "bg-[#DCFCE7] text-[#15803D]",
    DENIED: "bg-[#FEE2E2] text-[#B42318]",
    CANCELLED: "bg-[#F2F4F7] text-[#6B7280]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[status] || tones.OPEN}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

export default function ClaimsQueuePage() {
  const [type, setType] = useState("atoz");
  const [status, setStatus] = useState("UNDER_ADMIN_REVIEW");
  const [page, setPage] = useState(1);
  const requestKey = `${type}:${status}:${page}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });

  const load = useCallback(() => {
    const fetcher = type === "atoz" ? fetchAtozClaims : fetchSafeTClaims;
    fetcher({ status, page })
      .then((body) => setResult({ key: requestKey, data: body, error: null }))
      .catch((err) => setResult({ key: requestKey, data: null, error: err.message }));
  }, [type, status, page, requestKey]);

  useEffect(() => {
    load();
  }, [load]);

  const switchType = (t) => {
    setType(t);
    setStatus(t === "atoz" ? "UNDER_ADMIN_REVIEW" : "UNDER_REVIEW");
    setPage(1);
  };

  const body = result.key === requestKey ? result.data : null;
  const error = result.key === requestKey ? result.error : null;
  const claims = body?.claims || [];
  const pagination = body?.pagination;
  const loading = body === null && error === null;
  const statusTabs = type === "atoz" ? ATOZ_STATUS_TABS : SAFET_STATUS_TABS;

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-[#1B1F27]">Claims</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            A-to-z Guarantee (buyer protection) and SAFE-T (seller reimbursement) claims.
          </p>
        </header>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => switchType("atoz")}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
              type === "atoz" ? "bg-[#1B1F27] text-white" : "bg-white border border-[#D0D5DD] text-[#374151] hover:border-[#1B1F27]"
            }`}
          >
            A-to-z Guarantee
          </button>
          <button
            type="button"
            onClick={() => switchType("safet")}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
              type === "safet" ? "bg-[#1B1F27] text-white" : "bg-white border border-[#D0D5DD] text-[#374151] hover:border-[#1B1F27]"
            }`}
          >
            SAFE-T
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {statusTabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setStatus(t.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                status === t.value
                  ? "bg-[#2F5D9F] text-white"
                  : "bg-white border border-[#D0D5DD] text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white px-4 py-2">
          {loading && <p className="py-6 text-center text-sm text-[#6B7280]">Loading claims…</p>}
          {error && <p className="py-6 text-center text-sm text-[#B42318]">{error}</p>}
          {!loading && !error && claims.length === 0 && (
            <p className="py-6 text-center text-sm text-[#6B7280]">No claims in this view.</p>
          )}
          {!loading &&
            !error &&
            claims.map((c) => (
              <div
                key={c.claimId}
                className="flex items-center justify-between gap-3 py-3 border-b border-[#EEF0F3] last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-[#1B1F27]">{c.claimId}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5 truncate">{c.reason?.replace(/_/g, " ")}</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    Filed {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={type === "atoz" ? `/claims/atoz/${c.claimId}` : `/claims/safet/${c.claimId}`}
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
