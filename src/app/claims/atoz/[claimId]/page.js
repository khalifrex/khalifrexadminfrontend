"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAtozClaimDetail, decideAtozClaim } from "@/app/api/claimsApi";

export default function AdminAtozClaimDetailPage() {
  const { claimId } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await fetchAtozClaimDetail(claimId);
      setData(body);
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
      await decideAtozClaim(claimId, outcome, notes);
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

  const { claim, order, item, seller } = data;
  const canDecide = ["OPEN", "UNDER_ADMIN_REVIEW"].includes(claim.status);

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link href="/claims" className="text-xs font-semibold text-[#2F5D9F] hover:underline">
          &larr; Back to claims
        </Link>

        <div className="mt-3 mb-5">
          <h1 className="text-xl font-semibold text-[#1B1F27]">
            A-to-z Guarantee Claim — {claim.claimId}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Status: {claim.status.replace(/_/g, " ")} · Reason: {claim.reason.replace(/_/g, " ")}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Order {order?.orderId} · Item {item?.product?.name || item?.orderItemId} · Seller{" "}
            {seller?.businessName || seller?.sellerId}
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5 mb-4">
          <p className="text-sm font-bold text-[#1B1F27] mb-2">Buyer's claim</p>
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

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5 mb-4">
          <p className="text-sm font-bold text-[#1B1F27] mb-2">Seller's response</p>
          {claim.sellerResponse?.message ? (
            <>
              <p className="text-sm text-[#374151] whitespace-pre-wrap">{claim.sellerResponse.message}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Responded {new Date(claim.sellerResponse.respondedAt).toLocaleString()}
              </p>
            </>
          ) : (
            <p className="text-sm text-[#9CA3AF]">
              No response yet{claim.sellerResponseBy ? ` (due ${new Date(claim.sellerResponseBy).toLocaleString()})` : ""}.
            </p>
          )}
        </div>

        {claim.decision?.outcome ? (
          <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
            <p className="text-sm font-bold text-[#1B1F27] mb-2">Decision</p>
            <p className="text-sm text-[#374151]">
              {claim.decision.outcome} — {claim.decision.notes || "no notes"}
            </p>
          </div>
        ) : (
          canDecide && (
            <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
              <p className="text-sm font-bold text-[#1B1F27] mb-2">Decide this claim</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Notes (sent to both buyer and seller)…"
                className="w-full border border-[#D0D5DD] rounded-lg p-2 text-sm resize-none mb-3"
              />
              {actionError && <p className="text-xs text-[#B42318] mb-2">{actionError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => decide("GRANTED")}
                  disabled={deciding}
                  className="px-4 py-2 bg-[#15803D] text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  Grant (refund buyer)
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
