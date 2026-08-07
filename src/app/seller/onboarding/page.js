"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchSellerApplications } from "@/app/api/sellerReviewApi";

const STATUS_TABS = [
  { value: "submitted", label: "Pending review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "draft", label: "Draft" },
  { value: "all", label: "All" },
];

function StatusBadge({ status }) {
  const tones = {
    submitted: "bg-[#FEF3C7] text-[#92400E]",
    verified: "bg-[#DCFCE7] text-[#15803D]",
    rejected: "bg-[#FEE2E2] text-[#B42318]",
    draft: "bg-[#F2F4F7] text-[#6B7280]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[status] || tones.draft}`}>
      {status}
    </span>
  );
}

export default function SellerOnboardingReviewPage() {
  const [status, setStatus] = useState("submitted");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setData(null);
    setError(null);
    fetchSellerApplications({ status, page })
      .then((body) => {
        if (!ignore) setData(body);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [status, page]);

  const applications = data?.data || [];
  const pagination = data?.pagination;
  const loading = data === null && !error;

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-[#1B1F27]">Seller applications</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Sellers who have submitted a selling application for this marketplace.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setStatus(t.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
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
          {loading && <p className="py-6 text-center text-sm text-[#6B7280]">Loading applications…</p>}
          {error && <p className="py-6 text-center text-sm text-[#B42318]">{error}</p>}
          {!loading && !error && applications.length === 0 && (
            <p className="py-6 text-center text-sm text-[#6B7280]">No applications in this status.</p>
          )}
          {!loading &&
            !error &&
            applications.map((app) => (
              <div
                key={app.participationId}
                className="flex items-center justify-between gap-3 py-3 border-b border-[#EEF0F3] last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-[#1B1F27]">{app.storeName}</span>
                    <StatusBadge status={app.onboardingStatus} />
                    {app.rejectionCount > 0 && (
                      <span className="text-[11px] text-[#B42318]">
                        {app.rejectionCount} rejection{app.rejectionCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {app.fullName || "—"} · {app.email || "no email"} ·{" "}
                    {app.businessName || app.businessType} · {app.sellingPlan}
                  </p>
                  {app.submittedAt && (
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                      Submitted {new Date(app.submittedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <Link
                  href={`/seller/onboarding/verification/${encodeURIComponent(app.sellerId)}`}
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
