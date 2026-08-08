"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  fetchApplicationDetail,
  approveApplication,
  rejectApplication,
  APPLICATION_TYPES,
} from "@/app/api/applicationReviewApi";

const TYPE_LABELS = Object.fromEntries(APPLICATION_TYPES.map((t) => [t.value, t.label]));

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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status] || tones.pending}`}
    >
      {status?.replace(/_/g, " ")}
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

function DocLink({ label, doc }) {
  if (!doc?.url) {
    return (
      <div className="rounded-lg border border-[#E4E7EC] p-3">
        <p className="text-xs font-semibold text-[#1B1F27] mb-1">{label}</p>
        <p className="text-xs text-[#9CA3AF] italic">Not provided</p>
      </div>
    );
  }
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(doc.url);
  return (
    <div className="rounded-lg border border-[#E4E7EC] p-3">
      <p className="text-xs font-semibold text-[#1B1F27] mb-2">{label}</p>
      <a href={doc.url} target="_blank" rel="noreferrer" className="block w-fit">
        {isImage ? (
          <Image
            src={doc.url}
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

function ImageGallery({ label, images }) {
  if (!images?.length) {
    return (
      <div className="rounded-lg border border-[#E4E7EC] p-3">
        <p className="text-xs font-semibold text-[#1B1F27] mb-1">{label}</p>
        <p className="text-xs text-[#9CA3AF] italic">Not provided</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-[#E4E7EC] p-3">
      <p className="text-xs font-semibold text-[#1B1F27] mb-2">{label}</p>
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <a key={img.public_id || img.url || i} href={img.url} target="_blank" rel="noreferrer">
            <Image
              src={img.url}
              alt={`${label} ${i + 1}`}
              width={112}
              height={112}
              className="h-28 w-28 object-cover rounded-md border border-[#D0D5DD] hover:opacity-80"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

function TypeFields({ type, data }) {
  switch (type) {
    case "category_selling_existing":
      return (
        <div className="space-y-3">
          <InfoRow label="Category" value={data.productCategoryName || data.productCategoryCode} />
          <InfoRow label="Bought from distributor" value={data.boughtFromDistributor ? "Yes" : "No"} />
          <InfoRow label="Units intending to sell" value={data.unitsIntendingToSell} />
          <DocLink label="Invoice proof" doc={data.invoiceProof} />
        </div>
      );
    case "product_selling_existing":
      return (
        <div className="space-y-3">
          <InfoRow label="Product" value={data.productName} />
          <InfoRow label="KPID" value={data.productKPID} />
          <InfoRow label="Brand" value={data.brandName} />
          <InfoRow label="Category code" value={data.productCategoryCode} />
          <DocLink label="Invoice proof" doc={data.invoiceProof} />
        </div>
      );
    case "registered_brand_selling":
      return (
        <div className="space-y-3">
          <InfoRow
            label="Brand"
            value={data.brandName || data.brandRegistryId?.proposedBrandName}
          />
          <InfoRow label="Brand registry status" value={data.brandRegistryId?.approvalStatus} />
          <InfoRow label="Product" value={data.productName} />
          <InfoRow label="KPID" value={data.productKPID} />
          <DocLink label="Invoice proof" doc={data.invoiceProof} />
          <DocLink label="Letter of approval" doc={data.letterOfApproval} />
        </div>
      );
    case "catalog_authorization":
      return (
        <div className="space-y-3">
          <InfoRow
            label="Brand"
            value={data.brandName || data.brandRegistryId?.proposedBrandName}
          />
          <InfoRow label="Brand registry status" value={data.brandRegistryId?.approvalStatus} />
          <InfoRow label="Proposed product name" value={data.proposedProductName} />
          <InfoRow label="Proposed identifier" value={data.proposedProductIdentifier} />
          <InfoRow label="Manufacturer" value={data.manufacturer} />
          <div className="py-1">
            <p className="text-sm text-[#6B7280] mb-1">Description</p>
            <p className="text-sm text-[#1B1F27]">{data.proposedProductDescription || "—"}</p>
          </div>
          <InfoRow
            label="Expires"
            value={data.expiresAt ? new Date(data.expiresAt).toLocaleString() : "—"}
          />
          <InfoRow label="Product created from this?" value={data.productCreated ? "Yes" : "No"} />
          {data.createdProductKPID && (
            <InfoRow label="Created product KPID" value={data.createdProductKPID} />
          )}
          <DocLink label="Letter of authorization" doc={data.letterOfAuthorization} />
          <ImageGallery label="Product images" images={data.productImages} />
        </div>
      );
    case "brand_name_approval":
      return (
        <div className="space-y-3">
          <InfoRow label="Proposed brand name" value={data.proposedBrandName} />
          <ImageGallery label="Product images" images={data.productImages} />
        </div>
      );
    case "gtin_exemption":
      return (
        <div className="space-y-3">
          <InfoRow label="Brand" value={data.brandName} />
          <InfoRow label="Product" value={data.productName} />
          <InfoRow label="Category" value={data.productCategoryName || data.productCategoryCode} />
          <InfoRow label="Auto-approved" value={data.autoApproved ? "Yes" : "No"} />
          <InfoRow label="Expired" value={data.isExpired ? "Yes" : "No"} />
          {data.usedForProducts?.length > 0 && (
            <div className="py-1">
              <p className="text-sm text-[#6B7280] mb-1">Used for products</p>
              <ul className="text-sm text-[#1B1F27] list-disc list-inside">
                {data.usedForProducts.map((p) => (
                  <li key={p.KPID}>
                    {p.productName || p.KPID} ({p.KPID})
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ImageGallery label="Product images" images={data.productImages} />
        </div>
      );
    default:
      return null;
  }
}

export default function ApplicationDetailPage() {
  const { type, id } = useParams();

  const [result, setResult] = useState({ id: null, data: null, error: null });
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    fetchApplicationDetail(type, id)
      .then((data) => setResult({ id, data, error: null }))
      .catch((err) => setResult({ id, data: null, error: err.message }));
  }, [type, id]);

  useEffect(() => {
    load();
  }, [load]);

  const data = result.id === id ? result.data : null;
  const error = result.id === id ? result.error : null;

  const handleApprove = async () => {
    if (!confirm("Approve this application?")) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await approveApplication(type, id, adminNotes || undefined);
      setActionSuccess("Application approved");
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setActionError("A rejection reason is required");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await rejectApplication(type, id, rejectionReason, adminNotes || undefined);
      setActionSuccess("Application rejected");
      setShowReject(false);
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
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

  const seller = data.sellerId;
  const canAct = ["pending", "under_review"].includes(data.status);

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link
          href="/applications"
          className="text-sm text-[#6B7280] hover:text-[#2F5D9F] mb-4 inline-block"
        >
          ← Back to applications
        </Link>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-6 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-[#1B1F27]">
                  {TYPE_LABELS[type] || type}
                </h1>
                <StatusBadge status={data.status} />
              </div>
              <p className="text-sm text-[#6B7280] mt-1">
                {seller
                  ? `${seller.businessName || `${seller.firstName || ""} ${seller.lastName || ""}`.trim()} · ${seller.userId?.email || "no email"} · ${seller.sellerId}`
                  : "Seller record not found"}
              </p>
              {data.marketplaceId && (
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Marketplace: {data.marketplaceId.name} ({data.marketplaceId.code})
                </p>
              )}
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Submitted {new Date(data.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {(data.contactEmail || data.contactPhone || data.comment) && (
            <div className="mt-4 pt-4 border-t border-[#EEF0F3] space-y-1">
              {data.contactEmail && <InfoRow label="Contact email" value={data.contactEmail} />}
              {data.contactPhone && <InfoRow label="Contact phone" value={data.contactPhone} />}
              {data.comment && (
                <div className="py-1">
                  <p className="text-sm text-[#6B7280] mb-1">Seller comment</p>
                  <p className="text-sm text-[#1B1F27]">{data.comment}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-6 mb-5">
          <h2 className="text-sm font-semibold text-[#1B1F27] mb-3">Application details</h2>
          <TypeFields type={type} data={data} />
        </div>

        {(data.status === "approved" || data.status === "rejected") && (
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
                  <p className="text-sm text-[#6B7280] mb-1">Rejection reason</p>
                  <p className="text-sm text-[#B42318]">{data.rejectionReason}</p>
                </div>
              )}
              {data.adminNotes && (
                <div className="py-1">
                  <p className="text-sm text-[#6B7280] mb-1">Admin notes</p>
                  <p className="text-sm text-[#1B1F27]">{data.adminNotes}</p>
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

        {canAct && !showReject && (
          <div className="rounded-xl border border-[#E4E7EC] bg-white p-6 space-y-3">
            <label className="block text-xs font-semibold text-[#374151]">
              Admin notes (optional, internal only)
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-[#D0D5DD] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/30 focus:border-[#2F5D9F]"
              />
            </label>
            <div className="flex gap-2">
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
                onClick={() => setShowReject(true)}
                className="rounded-md bg-[#B42318] px-4 py-2 text-sm font-semibold text-white hover:bg-[#912018] disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {canAct && showReject && (
          <div className="rounded-lg border border-[#FDA29B] bg-[#FEF3F2] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#B42318]">Reject application</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (shown to seller)"
              rows={3}
              className="w-full rounded-md border border-[#D0D5DD] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B42318]/30 focus:border-[#B42318]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitting || !rejectionReason.trim()}
                onClick={handleReject}
                className="rounded-md bg-[#B42318] px-4 py-2 text-sm font-semibold text-white hover:bg-[#912018] disabled:opacity-50"
              >
                {submitting ? "Rejecting…" : "Confirm rejection"}
              </button>
              <button
                type="button"
                onClick={() => setShowReject(false)}
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
