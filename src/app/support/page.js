"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchSupportTickets } from "@/app/api/supportApi";

const STATUS_TABS = [
  { value: "WAITING", label: "Waiting" },
  { value: "ACTIVE", label: "Active" },
  { value: "ENDED", label: "Ended" },
  { value: "EMAIL_SENT", label: "Email" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "all", label: "All" },
];

const CHANNEL_TABS = [
  { value: "all", label: "All channels" },
  { value: "CHAT", label: "Chat" },
  { value: "EMAIL", label: "Email" },
];

function StatusBadge({ status }) {
  const tones = {
    WAITING: "bg-[#FEF3C7] text-[#92400E]",
    ACTIVE: "bg-[#DBEAFE] text-[#1D4ED8]",
    ENDED: "bg-[#F2F4F7] text-[#6B7280]",
    EMAIL_SENT: "bg-[#DCFCE7] text-[#15803D]",
    RESOLVED: "bg-[#DCFCE7] text-[#15803D]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[status] || tones.WAITING}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

const timeAgo = (d) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function SupportQueuePage() {
  const [status, setStatus] = useState("WAITING");
  const [channel, setChannel] = useState("all");
  const [page, setPage] = useState(1);
  const requestKey = `${status}:${channel}:${page}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });

  const load = useCallback(() => {
    fetchSupportTickets({ status, channel, page })
      .then((body) => setResult({ key: requestKey, data: body, error: null }))
      .catch((err) => setResult({ key: requestKey, data: null, error: err.message }));
  }, [status, channel, page, requestKey]);

  useEffect(() => {
    load();
  }, [load]);

  const body = result.key === requestKey ? result.data : null;
  const error = result.key === requestKey ? result.error : null;
  const tickets = body?.tickets || [];
  const pagination = body?.pagination;
  const loading = body === null && error === null;

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-[#1B1F27]">Support</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Live chat queue and buyer/seller support tickets.
          </p>
        </header>

        <div className="mb-3 flex flex-wrap gap-2">
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
                  ? "bg-[#1B1F27] text-white"
                  : "bg-white border border-[#D0D5DD] text-[#374151] hover:border-[#1B1F27]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {CHANNEL_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setChannel(t.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                channel === t.value
                  ? "bg-[#2F5D9F] text-white"
                  : "bg-white border border-[#D0D5DD] text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white px-4 py-2">
          {loading && <p className="py-6 text-center text-sm text-[#6B7280]">Loading tickets…</p>}
          {error && <p className="py-6 text-center text-sm text-[#B42318]">{error}</p>}
          {!loading && !error && tickets.length === 0 && (
            <p className="py-6 text-center text-sm text-[#6B7280]">No tickets in this view.</p>
          )}
          {!loading &&
            !error &&
            tickets.map((t) => (
              <div
                key={t.ticketId}
                className="flex items-center justify-between gap-3 py-3 border-b border-[#EEF0F3] last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-[#1B1F27]">
                      {t.participantCode || t.requesterType}
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                      {t.requesterType} · {t.channel}
                    </span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5 truncate">
                    {t.subject || t.topic}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    {timeAgo(t.createdAt)}
                  </p>
                </div>
                <Link
                  href={`/support/${t.ticketId}`}
                  className="shrink-0 rounded-md border border-[#D0D5DD] px-3 py-1.5 text-xs font-semibold text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
                >
                  Open →
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
