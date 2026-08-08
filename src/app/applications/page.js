"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchApplications,
  fetchApplicationCounts,
  APPLICATION_TYPES,
} from "@/app/api/applicationReviewApi";

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "all", label: "All" },
];

function StatusBadge({ status }) {
  const tones = {
    pending: "bg-[#FEF3C7] text-[#92400E]",
    under_review: "bg-[#DBEAFE] text-[#1D4ED8]",
    approved: "bg-[#DCFCE7] text-[#15803D]",
    rejected: "bg-[#FEE2E2] text-[#B42318]",
    expired: "bg-[#F2F4F7] text-[#6B7280]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[status] || tones.pending}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

const applicantLabel = (app) => {
  const seller = app.sellerId;
  if (!seller) return "Unknown seller";
  const name = `${seller.firstName || ""} ${seller.lastName || ""}`.trim();
  return seller.businessName || name || seller.sellerId || "Unknown seller";
};

const summaryLine = (type, app) => {
  switch (type) {
    case "category_selling_existing":
      return app.productCategoryName || app.productCategoryCode;
    case "product_selling_existing":
      return `${app.productName || app.productKPID}${app.brandName ? ` · ${app.brandName}` : ""}`;
    case "registered_brand_selling":
      return `${app.brandName || app.brandRegistryId?.proposedBrandName || ""} · ${app.productName || app.productKPID}`;
    case "catalog_authorization":
      return `${app.brandName} · ${app.proposedProductName}`;
    case "brand_name_approval":
      return app.proposedBrandName;
    case "gtin_exemption":
      return `${app.brandName} · ${app.productCategoryName || app.productCategoryCode}`;
    default:
      return "";
  }
};

export default function ApplicationsReviewPage() {
  const [type, setType] = useState(APPLICATION_TYPES[0].value);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState(null);

  const requestKey = `${type}:${status}:${page}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });

  const load = useCallback(() => {
    fetchApplications(type, { status, page })
      .then((body) => setResult({ key: requestKey, data: body, error: null }))
      .catch((err) => setResult({ key: requestKey, data: null, error: err.message }));
  }, [type, status, page, requestKey]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchApplicationCounts()
      .then(setCounts)
      .catch(() => {});
  }, [result.key]);

  const body = result.key === requestKey ? result.data : null;
  const error = result.key === requestKey ? result.error : null;
  const applications = body?.data || [];
  const pagination = body?.pagination;
  const loading = body === null && error === null;

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-[#1B1F27]">Selling applications</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Review and action seller applications for category access, brand selling,
            catalog authorization, and product ID exemptions.
          </p>
        </header>

        <div className="mb-3 flex flex-wrap gap-2">
          {APPLICATION_TYPES.map((t) => {
            const count = counts?.[t.value]?.pending;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setType(t.value);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 ${
                  type === t.value
                    ? "bg-[#1B1F27] text-white"
                    : "bg-white border border-[#D0D5DD] text-[#374151] hover:border-[#1B1F27]"
                }`}
              >
                {t.label}
                {!!count && (
                  <span
                    className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 py-0.5 ${
                      type === t.value ? "bg-white/20 text-white" : "bg-[#FEF3C7] text-[#92400E]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
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
          {loading && (
            <p className="py-6 text-center text-sm text-[#6B7280]">Loading applications…</p>
          )}
          {error && <p className="py-6 text-center text-sm text-[#B42318]">{error}</p>}
          {!loading && !error && applications.length === 0 && (
            <p className="py-6 text-center text-sm text-[#6B7280]">No applications in this status.</p>
          )}
          {!loading &&
            !error &&
            applications.map((app) => (
              <div
                key={app._id}
                className="flex items-center justify-between gap-3 py-3 border-b border-[#EEF0F3] last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-[#1B1F27]">{applicantLabel(app)}</span>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5 truncate">{summaryLine(type, app)}</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    Submitted {new Date(app.createdAt).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/applications/${type}/${app._id}`}
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
