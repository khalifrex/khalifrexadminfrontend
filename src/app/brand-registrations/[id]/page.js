"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  fetchBrandRegistrationDetail,
  approveBrandRegistration,
  rejectBrandRegistration,
  suspendBrandRegistration,
  reinstateBrandRegistration,
} from "@/app/api/brandRegistryReviewApi";

function StatusBadge({ status }) {
  const tones = {
    pending: "bg-[#FEF3C7] text-[#92400E]",
    approved: "bg-[#DCFCE7] text-[#15803D]",
    rejected: "bg-[#FEE2E2] text-[#B42318]",
    suspended: "bg-[#F2F4F7] text-[#6B7280]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status] || tones.pending}`}
    >
      {status}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-[#6B7280]">{label}</span>
      <span className="text-[#1B1F27] font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function DocLink({ label, url }) {
  if (!url) {
    return (
      <div className="rounded-lg border border-[#E4E7EC] p-3">
        <p className="text-xs font-semibold text-[#1B1F27] mb-1">{label}</p>
        <p className="text-xs text-[#9CA3AF] italic">Not provided</p>
      </div>
    );
  }
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(url);
  return (
    <div className="rounded-lg border border-[#E4E7EC] p-3">
      <p className="text-xs font-semibold text-[#1B1F27] mb-2">{label}</p>
      <a href={url} target="_blank" rel="noreferrer" className="block w-fit">
        {isImage ? (
          <Image
            src={url}
            alt={label}
            width={128}
            height={128}
            className="h-32 w-32 object-cover rounded-md border border-[#D0D5DD] hover:opacity-80"
          />
        ) : (
          <span className="text-sm text-[#2F5D9F] hover:underline">View document →</span>
        )}
      </a>
    </div>
  );
}

const PROOF_LABEL = {
  yes: "Proof of trademark ownership",
  have_authorization: "Letter of authorization",
  have_license_agreement_contract: "License agreement or contract",
};

const PROOF_URL_FIELD = {
  yes: "proofOfTrademarkOwnership",
  have_authorization: "proofOfAuthorization",
  have_license_agreement_contract: "proofOfLicenseAgreementOrContract",
};

export default function BrandRegistrationDetailPage() {
  const { id } = useParams();

  const [result, setResult] = useState({ id: null, data: null, error: null });
  const [actionPanel, setActionPanel] = useState(null); // 'reject' | 'suspend' | null
  const [reasonInput, setReasonInput] = useState("");
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    fetchBrandRegistrationDetail(id)
      .then((data) => setResult({ id, data, error: null }))
      .catch((err) => setResult({ id, data: null, error: err.message }));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const data = result.id === id ? result.data : null;
  const error = result.id === id ? result.error : null;

  const runAction = async (fn, successMessage) => {
    setSubmitting(true);
    setActionError(null);
    try {
      await fn();
      setActionSuccess(successMessage);
      setActionPanel(null);
      setReasonInput("");
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = () => {
    if (!confirm("Approve this brand registration?")) return;
    runAction(() => approveBrandRegistration(id), "Brand approved");
  };

  const handleReinstate = () => {
    if (!confirm("Reinstate this brand back to approved?")) return;
    runAction(() => reinstateBrandRegistration(id), "Brand reinstated");
  };

  const handleReject = () => {
    if (!reasonInput.trim()) {
      setActionError("A rejection reason is required");
      return;
    }
    runAction(() => rejectBrandRegistration(id, reasonInput), "Brand rejected");
  };

  const handleSuspend = () => {
    if (!reasonInput.trim()) {
      setActionError("A suspension reason is required");
      return;
    }
    runAction(() => suspendBrandRegistration(id, reasonInput), "Brand suspended");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <p className="text-sm text-[#B42318]">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <p className="text-sm text-[#6B7280]">Loading…</p>
      </div>
    );
  }

  const proofUrl = PROOF_URL_FIELD[data.ownTrademark] ? data[PROOF_URL_FIELD[data.ownTrademark]] : null;

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link
          href="/brand-registrations"
          className="text-sm text-[#6B7280] hover:text-[#2F5D9F] mb-4 inline-block"
        >
          ← Back to brand registrations
        </Link>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-6 mb-5">
          <div className="flex items-start gap-4 flex-wrap">
            {data.logo?.url && (
              <Image
                src={data.logo.url}
                alt={data.brandName}
                width={56}
                height={56}
                className="h-14 w-14 object-cover rounded-lg border border-[#E4E7EC]"
              />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-[#1B1F27]">{data.brandName}</h1>
                <StatusBadge status={data.approvalStatus} />
              </div>
              <p className="text-sm text-[#6B7280] mt-1">
                {data.ownerId?.fullName || "Unknown owner"} · {data.ownerId?.email || "no email"}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Submitted {new Date(data.createdAt).toLocaleString()}
              </p>
              {data.websiteUrl && (
                <a
                  href={data.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#2F5D9F] hover:underline mt-0.5 inline-block"
                >
                  {data.websiteUrl}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-6 mb-5">
          <h2 className="text-sm font-semibold text-[#1B1F27] mb-3">Brand details</h2>
          <div className="space-y-1">
            <InfoRow label="Categories" value={data.brandCategories?.join(", ")} />
            {data.KPIDs?.length > 0 && <InfoRow label="Existing product IDs" value={data.KPIDs.join(", ")} />}
            <InfoRow
              label="Production setup"
              value={data.brandProductionSetup?.option?.replace(/_/g, " ")}
            />
            <InfoRow label="Sells to distributors" value={data.brandSellToDistributors ? "Yes" : "No"} />
            <InfoRow label="Licenses others on Khalifrex" value={data.licenseSellOnKhalifrex ? "Yes" : "No"} />
            <InfoRow label="GTIN enforced" value={data.isGTINEnforced ? "Yes" : "No"} />
          </div>
          {data.productImages?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-[#1B1F27] mb-2">Product images</p>
              <div className="flex flex-wrap gap-3">
                {data.productImages.map((img, i) => (
                  <a key={img.public_id || img.url || i} href={img.url} target="_blank" rel="noreferrer">
                    <Image
                      src={img.url}
                      alt={`Product ${i + 1}`}
                      width={112}
                      height={112}
                      className="h-28 w-28 object-cover rounded-md border border-[#D0D5DD] hover:opacity-80"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-6 mb-5">
          <h2 className="text-sm font-semibold text-[#1B1F27] mb-3">Trademark</h2>
          <div className="space-y-1">
            <InfoRow label="Office" value={data.trademarkOffice} />
            <InfoRow label="Status" value={data.trademarkStatus} />
            <InfoRow label="Type" value={data.trademarkType?.replace(/_/g, " ")} />
            {data.registrationNumber && (
              <InfoRow label="Registration number" value={data.registrationNumber} />
            )}
            {data.serialNumber && <InfoRow label="Serial number" value={data.serialNumber} />}
            <InfoRow
              label="Relationship to trademark"
              value={data.ownTrademark?.replace(/_/g, " ")}
            />
          </div>
          <div className="mt-3">
            <DocLink label={PROOF_LABEL[data.ownTrademark] || "Proof document"} url={proofUrl} />
          </div>
        </div>

        {(data.approvalStatus === "approved" || data.approvalStatus === "rejected" || data.approvalStatus === "suspended") && (
          <div className="rounded-xl border border-[#E4E7EC] bg-white p-6 mb-5">
            <h2 className="text-sm font-semibold text-[#1B1F27] mb-3">Review</h2>
            <div className="space-y-1">
              <InfoRow
                label="Reviewed by"
                value={data.reviewedBy?.fullName || data.reviewedBy?.email || "—"}
              />
              <InfoRow
                label="Reviewed at"
                value={data.reviewedAt ? new Date(data.reviewedAt).toLocaleString() : "—"}
              />
              {data.rejectionReason && (
                <div className="py-1">
                  <p className="text-sm text-[#6B7280] mb-1">
                    {data.approvalStatus === "suspended" ? "Suspension reason" : "Rejection reason"}
                  </p>
                  <p className="text-sm text-[#B42318]">{data.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {actionSuccess && (
          <div className="mb-4 rounded-lg border border-[#A6F4C5] bg-[#ECFDF3] px-4 py-3 text-sm text-[#15803D]">
            {actionSuccess}
          </div>
        )}
        {actionError && (
          <div className="mb-4 rounded-lg border border-[#FDA29B] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]">
            {actionError}
          </div>
        )}

        {data.approvalStatus === "pending" && !actionPanel && (
          <div className="rounded-xl border border-[#E4E7EC] bg-white p-6 flex gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={handleApprove}
              className="rounded-md bg-[#15803D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#116932] disabled:opacity-50"
            >
              {submitting ? "Approving…" : "Approve"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setActionPanel("reject")}
              className="rounded-md bg-[#B42318] px-4 py-2 text-sm font-semibold text-white hover:bg-[#912018] disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}

        {data.approvalStatus === "approved" && !actionPanel && (
          <div className="rounded-xl border border-[#E4E7EC] bg-white p-6">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setActionPanel("suspend")}
              className="rounded-md bg-[#B42318] px-4 py-2 text-sm font-semibold text-white hover:bg-[#912018] disabled:opacity-50"
            >
              Suspend
            </button>
          </div>
        )}

        {data.approvalStatus === "suspended" && (
          <div className="rounded-xl border border-[#E4E7EC] bg-white p-6">
            <button
              type="button"
              disabled={submitting}
              onClick={handleReinstate}
              className="rounded-md bg-[#15803D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#116932] disabled:opacity-50"
            >
              {submitting ? "Reinstating…" : "Reinstate"}
            </button>
          </div>
        )}

        {actionPanel === "reject" && (
          <div className="rounded-lg border border-[#FDA29B] bg-[#FEF3F2] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#B42318]">Reject brand registration</h3>
            <textarea
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Reason for rejection (shown to the seller)"
              rows={3}
              className="w-full rounded-md border border-[#D0D5DD] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B42318]/30 focus:border-[#B42318]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitting || !reasonInput.trim()}
                onClick={handleReject}
                className="rounded-md bg-[#B42318] px-4 py-2 text-sm font-semibold text-white hover:bg-[#912018] disabled:opacity-50"
              >
                {submitting ? "Rejecting…" : "Confirm rejection"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionPanel(null);
                  setReasonInput("");
                }}
                disabled={submitting}
                className="rounded-md px-4 py-2 text-sm font-medium text-[#374151] hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {actionPanel === "suspend" && (
          <div className="rounded-lg border border-[#FDA29B] bg-[#FEF3F2] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#B42318]">Suspend brand registration</h3>
            <textarea
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Reason for suspension (shown to the seller)"
              rows={3}
              className="w-full rounded-md border border-[#D0D5DD] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B42318]/30 focus:border-[#B42318]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitting || !reasonInput.trim()}
                onClick={handleSuspend}
                className="rounded-md bg-[#B42318] px-4 py-2 text-sm font-semibold text-white hover:bg-[#912018] disabled:opacity-50"
              >
                {submitting ? "Suspending…" : "Confirm suspension"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionPanel(null);
                  setReasonInput("");
                }}
                disabled={submitting}
                className="rounded-md px-4 py-2 text-sm font-medium text-[#374151] hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
