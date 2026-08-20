"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchSafeTClaimDetail, decideSafeTClaim } from "@/app/api/claimsApi";

export default function AdminSafeTClaimDetailPage() {
  const { claimId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await fetchSafeTClaimDetail(claimId);
      setData(body);
      setAmount(String(body.claim?.requestedAmount?.amount ?? ""));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (outcome) => {
    setDeciding(true);
    setActionError(null);
    try {
      await decideSafeTClaim(claimId, outcome, outcome === "APPROVED" ? Number(amount) : undefined, notes);
      await load();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setDeciding(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8] text-sm text-[#6B7280]">Loading…</div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
        <p className="text-sm text-[#B42318]">{error || "Claim not found"}</p>
      </div>
    );
  }

  const { claim, seller } = data;
  const canDecide = ["OPEN", "UNDER_REVIEW"].includes(claim.status);

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link href="/claims" className="text-xs font-semibold text-[#2F5D9F] hover:underline">
          &larr; Back to claims
        </Link>

        <div className="mt-3 mb-5">
          <h1 className="text-xl font-semibold text-[#1B1F27]">SAFE-T Claim — {claim.claimId}</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Status: {claim.status.replace(/_/g, " ")} · Reason: {claim.reason.replace(/_/g, " ")}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Seller {seller?.businessName || seller?.sellerId} · Requested{" "}
            {claim.requestedAmount?.currencyCode} {claim.requestedAmount?.amount}
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5 mb-4">
          <p className="text-sm font-bold text-[#1B1F27] mb-2">Seller's claim</p>
          <p className="text-sm text-[#374151] whitespace-pre-wrap">{claim.description || "—"}</p>
          {claim.evidence?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {claim.evidence.map((e, i) => (
                <a
                  key={i}
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline text-[#2F5D9F]"
                >
                  {e.filename || `Evidence ${i + 1}`}
                </a>
              ))}
            </div>
          )}
        </div>

        {claim.decision?.outcome ? (
          <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
            <p className="text-sm font-bold text-[#1B1F27] mb-2">Decision</p>
            <p className="text-sm text-[#374151]">
              {claim.decision.outcome}
              {claim.decision.outcome === "APPROVED"
                ? ` — ${claim.requestedAmount?.currencyCode} ${claim.decision.reimbursedAmount} reimbursed`
                : ""}{" "}
              — {claim.decision.notes || "no notes"}
            </p>
          </div>
        ) : (
          canDecide && (
            <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
              <p className="text-sm font-bold text-[#1B1F27] mb-2">Decide this claim</p>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Reimbursement amount ({claim.requestedAmount?.currencyCode})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm mb-3"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Notes (sent to seller)…"
                className="w-full border border-[#D0D5DD] rounded-lg p-2 text-sm resize-none mb-3"
              />
              {actionError && <p className="text-xs text-[#B42318] mb-2">{actionError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => decide("APPROVED")}
                  disabled={deciding}
                  className="px-4 py-2 bg-[#15803D] text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  Approve & reimburse
                </button>
                <button
                  onClick={() => decide("DENIED")}
                  disabled={deciding}
                  className="px-4 py-2 border border-[#D0D5DD] text-[#374151] text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Deny
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
