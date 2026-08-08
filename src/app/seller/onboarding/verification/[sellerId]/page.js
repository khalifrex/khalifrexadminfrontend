"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchSellerApplicationDetail,
  verifySellerApplication,
  rejectSellerApplication,
} from "@/app/api/sellerReviewApi";
import Image from "next/image";
import { FileText } from "lucide-react";

const isImageUrl = (url) => /\.(png|jpe?g|webp|gif)$/i.test(url || "");
const ALL_SECTIONS = [
  { value: "personal_info", label: "Personal info" },
  { value: "business_info", label: "Business info", businessOnly: true },
  { value: "identity_document", label: "Identity document" },
  { value: "identity_selfie", label: "Selfie with ID" },
  { value: "primary_proof_of_address", label: "Proof of address (personal)" },
  {
    value: "business_registration_extract",
    label: "Business registration extract",
    businessOnly: true,
  },
  {
    value: "business_proof_of_address",
    label: "Proof of address (business)",
    businessOnly: true,
  },
  {
    value: "letter_of_authorization",
    label: "Letter of authorization",
    businessOnly: true,
  },
  { value: "bank_account", label: "Bank account" },
];

const humanizeSection = (section) =>
  ALL_SECTIONS.find((s) => s.value === section)?.label || section;

function StatusPill({ status }) {
  const tones = {
    verified: "bg-[#DCFCE7] text-[#15803D]",
    pending: "bg-[#FEF3C7] text-[#92400E]",
    rejected: "bg-[#FEE2E2] text-[#B42318]",
    not_started: "bg-[#F2F4F7] text-[#6B7280]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tones[status] || tones.not_started}`}
    >
      {status?.replace(/_/g, " ") || "not started"}
    </span>
  );
}

function OnboardingBadge({ status }) {
  const tones = {
    submitted: "bg-[#FEF3C7] text-[#92400E]",
    verified: "bg-[#DCFCE7] text-[#15803D]",
    rejected: "bg-[#FEE2E2] text-[#B42318]",
    draft: "bg-[#F2F4F7] text-[#6B7280]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status] || tones.draft}`}
    >
      {status}
    </span>
  );
}

function DocSection({ title, status, rejectionReason, images = [], meta }) {
  return (
    <div className="rounded-lg border border-[#E4E7EC] p-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h4 className="text-sm font-semibold text-[#1B1F27]">{title}</h4>
        {status && <StatusPill status={status} />}
      </div>
      {meta && <p className="text-xs text-[#6B7280] mb-2">{meta}</p>}
      {images.length === 0 ? (
        <p className="text-xs text-[#9CA3AF] italic">Not uploaded</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {images.map((img) =>
            isImageUrl(img.url) ? (
              <a
                key={img.url}
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Image
                  src={img.url}
                  alt={img.label}
                  width={128}
                  height={128}
                  className="h-32 w-32 object-cover rounded-md border border-[#D0D5DD] hover:opacity-80"
                />
                <p className="text-[10px] text-[#6B7280] mt-1 text-center max-w-[128px] truncate">
                  {img.label}
                </p>
              </a>
            ) : (
              <a
                key={img.url}
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-md border border-[#D0D5DD] bg-[#F9FAFB] hover:bg-[#F2F4F7]"
              >
                <FileText className="h-8 w-8 text-[#6B7280]" />
                <span className="text-[10px] font-medium text-[#2F5D9F]">
                  View PDF
                </span>
                <p className="text-[10px] text-[#6B7280] text-center max-w-[110px] truncate px-1">
                  {img.label}
                </p>
              </a>
            ),
          )}
        </div>
      )}
      {rejectionReason && (
        <p className="text-xs text-[#B42318] mt-2">
          Rejection note: {rejectionReason}
        </p>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-[#6B7280]">{label}</span>
      <span className="text-[#1B1F27] font-medium text-right">
        {value ?? "—"}
      </span>
    </div>
  );
}

function AddressBlock({ address }) {
  if (!address)
    return <p className="text-xs text-[#9CA3AF] italic">Not provided</p>;
  return (
    <div className="text-sm text-[#1B1F27] space-y-0.5">
      <p>
        {address.address1}
        {address.address2 ? `, ${address.address2}` : ""}
      </p>
      <p>
        {address.city}, {address.state} {address.postcode}
      </p>
      <p>{address.country}</p>
      <p className="text-[#6B7280]">
        {address.phoneCountryCode} {address.phoneNumber}
      </p>
    </div>
  );
}

function RejectPanel({ isBusiness, onSubmit, onCancel, submitting, error }) {
  const [selected, setSelected] = useState({});
  const sections = ALL_SECTIONS.filter((s) => !s.businessOnly || isBusiness);

  const toggle = (section) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (section in next) delete next[section];
      else next[section] = "";
      return next;
    });

  const canSubmit =
    Object.keys(selected).length > 0 &&
    Object.values(selected).every((r) => r.trim().length > 0);

  return (
    <div className="rounded-lg border border-[#FDA29B] bg-[#FEF3F2] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[#B42318]">
        Reject application
      </h3>
      <p className="text-xs text-[#6B7280]">
        Check every section that needs correction and explain why — the seller
        will see these notes.
      </p>
      <div className="space-y-2">
        {sections.map((s) => (
          <div key={s.value}>
            <label className="flex items-center gap-2 text-sm text-[#374151]">
              <input
                type="checkbox"
                checked={s.value in selected}
                onChange={() => toggle(s.value)}
                className="rounded border-[#D0D5DD]"
              />
              {s.label}
            </label>
            {s.value in selected && (
              <textarea
                value={selected[s.value]}
                onChange={(e) =>
                  setSelected((prev) => ({
                    ...prev,
                    [s.value]: e.target.value,
                  }))
                }
                placeholder="Reason for rejection (shown to seller)"
                rows={2}
                className="mt-1 w-full rounded-md border border-[#D0D5DD] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B42318]/30 focus:border-[#B42318]"
              />
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-xs text-[#B42318]">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={() =>
            onSubmit(
              Object.entries(selected).map(([section, reason]) => ({
                section,
                reason,
              })),
            )
          }
          className="rounded-md bg-[#B42318] px-4 py-2 text-sm font-semibold text-white hover:bg-[#912018] disabled:opacity-50"
        >
          {submitting ? "Rejecting…" : "Confirm rejection"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md px-4 py-2 text-sm font-medium text-[#374151] hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SellerVerificationDetailPage() {
  const { sellerId } = useParams();
  const router = useRouter();

  const [result, setResult] = useState({ sellerId: null, data: null, error: null });
  const [showReject, setShowReject] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    fetchSellerApplicationDetail(sellerId)
      .then((data) => setResult({ sellerId, data, error: null }))
      .catch((err) => setResult({ sellerId, data: null, error: err.message }));
  }, [sellerId]);

  useEffect(() => {
    load();
  }, [load]);

  const data = result.sellerId === sellerId ? result.data : null;
  const error = result.sellerId === sellerId ? result.error : null;

  const handleVerify = async () => {
    if (
      !confirm("Verify this seller's application? This activates their store.")
    )
      return;
    setSubmitting(true);
    setActionError(null);
    try {
      await verifySellerApplication(sellerId);
      setActionSuccess("Application verified");
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (reasons) => {
    setSubmitting(true);
    setActionError(null);
    try {
      await rejectSellerApplication(sellerId, reasons);
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

  const { seller, participation } = data;
  const v = seller.verification || {};
  const pc = v.primaryContact || {};
  const biz = v.business || {};
  const isBusiness = seller.businessType !== "individual";
  const idDoc = pc.identityDocument || {};
  const idImages = [];
  if (idDoc.frontUrl) idImages.push({ label: "Front", url: idDoc.frontUrl });
  if (idDoc.backUrl) idImages.push({ label: "Back", url: idDoc.backUrl });

  const canAct =
    participation &&
    ["submitted", "verified"].includes(participation.onboardingStatus);

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link
          href="/seller/onboarding"
          className="text-sm text-[#6B7280] hover:text-[#2F5D9F] mb-4 inline-block"
        >
          ← Back to applications
        </Link>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-6 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-[#1B1F27]">
                  {participation?.storeName ||
                    `${seller.firstName || ""} ${seller.lastName || ""}`.trim()}
                </h1>
                {participation && (
                  <OnboardingBadge status={participation.onboardingStatus} />
                )}
              </div>
              <p className="text-sm text-[#6B7280] mt-1">
                {seller.firstName} {seller.lastName} · {seller.userId?.email} ·{" "}
                {seller.sellerId}
              </p>
              {participation?.marketplaceId && (
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Marketplace: {participation.marketplaceId.name} (
                  {participation.marketplaceId.code})
                </p>
              )}
              {participation?.submittedAt && (
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Submitted{" "}
                  {new Date(participation.submittedAt).toLocaleString()}
                </p>
              )}
            </div>

            {canAct && (
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={
                    submitting || participation.onboardingStatus === "verified"
                  }
                  className="rounded-md bg-[#15803D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#106830] disabled:opacity-50"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => setShowReject((v) => !v)}
                  disabled={submitting}
                  className="rounded-md border border-[#FDA29B] px-4 py-2 text-sm font-semibold text-[#B42318] hover:bg-[#FEF3F2] disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </div>

          {actionSuccess && (
            <p className="mt-3 text-sm text-[#15803D] bg-[#DCFCE7] rounded-md px-3 py-2">
              {actionSuccess}
            </p>
          )}
          {actionError && (
            <p className="mt-3 text-sm text-[#B42318] bg-[#FEF3F2] rounded-md px-3 py-2">
              {actionError}
            </p>
          )}
          {!participation && (
            <p className="mt-3 text-sm text-[#B42318]">
              This seller has no application for the currently selected
              marketplace.
            </p>
          )}

          {participation?.rejectionReasons?.length > 0 && (
            <div className="mt-4 rounded-md border border-[#FDA29B] bg-[#FEF3F2] p-3">
              <p className="text-xs font-semibold text-[#B42318] mb-1.5">
                Previous rejection reasons
              </p>
              <ul className="space-y-1">
                {participation.rejectionReasons.map((r, i) => (
                  <li key={i} className="text-xs text-[#912018]">
                    <span className="font-semibold">
                      {humanizeSection(r.section)}:
                    </span>{" "}
                    {r.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showReject && canAct && (
            <div className="mt-4">
              <RejectPanel
                isBusiness={isBusiness}
                onSubmit={handleReject}
                onCancel={() => setShowReject(false)}
                submitting={submitting}
                error={actionError}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#1B1F27] mb-3">
              Personal info
            </h3>
            <InfoRow
              label="Full name"
              value={`${seller.firstName || ""} ${seller.middleName || ""} ${seller.lastName || ""}`
                .replace(/\s+/g, " ")
                .trim()}
            />
            <InfoRow label="Date of birth" value={seller.dateOfBirth} />
            <InfoRow
              label="Country of citizenship"
              value={seller.countryOfCitizenship}
            />
            <InfoRow label="Country of birth" value={seller.countryOfBirth} />
            <InfoRow label="Email" value={seller.userId?.email} />
            <InfoRow
              label="Email verified"
              value={seller.userId?.isEmailVerified ? "Yes" : "No"}
            />
            <div className="mt-2">
              <p className="text-xs text-[#6B7280] mb-1">Residential address</p>
              <AddressBlock address={seller.residentialAddress} />
            </div>
          </div>

          <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#1B1F27] mb-3">
              Business info
            </h3>
            <InfoRow label="Business type" value={seller.businessType} />
            <InfoRow
              label="Business location"
              value={seller.businessLocation}
            />
            {isBusiness && (
              <>
                <InfoRow label="Business name" value={seller.businessName} />
                <InfoRow
                  label="Registration number"
                  value={seller.companyRegistrationNumber}
                />
                <InfoRow
                  label="Beneficial owner/director/trustee"
                  value={seller.isBeneficialOwnerDirectorTrustee ? "Yes" : "No"}
                />
                <InfoRow
                  label="Only beneficial owner"
                  value={seller.isOnlyBeneficialOwner ? "Yes" : "No"}
                />
                <InfoRow
                  label="Acting on own behalf"
                  value={seller.confirmActingOnOwnOnBehalf ? "Yes" : "No"}
                />
                <div className="mt-2">
                  <p className="text-xs text-[#6B7280] mb-1">
                    Business address
                  </p>
                  <AddressBlock address={seller.businessAddress} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5 mb-5">
          <h3 className="text-sm font-semibold text-[#1B1F27] mb-3">
            Store & selling plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <InfoRow label="Store name" value={participation?.storeName} />
              <InfoRow
                label="Selling plan"
                value={participation?.sellingPlan}
              />
              <InfoRow
                label="Has UPCs for all products"
                value={
                  participation?.hasUPCsForAllProducts == null
                    ? "—"
                    : participation.hasUPCsForAllProducts
                      ? "Yes"
                      : "No"
                }
              />
              <InfoRow
                label="Owns/represents brand"
                value={participation?.ownsBrandOrRepresentsBrand}
              />
            </div>
            <div>
              <InfoRow
                label="About seller"
                value={participation?.aboutSeller}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5 mb-5">
          <h3 className="text-sm font-semibold text-[#1B1F27] mb-3">
            Identity verification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocSection
              title="Identity document"
              status={idDoc.status}
              rejectionReason={idDoc.rejectionReason}
              images={idImages}
              meta={
                idDoc.type
                  ? `${idDoc.type} · issued by ${idDoc.countryOfIssue || "—"}${idDoc.expiryDate ? ` · expires ${new Date(idDoc.expiryDate).toLocaleDateString()}` : ""}`
                  : null
              }
            />
            <DocSection
              title="Selfie with ID"
              status={pc.selfieWithId?.status}
              rejectionReason={pc.selfieWithId?.rejectionReason}
              images={
                pc.selfieWithId?.url
                  ? [{ label: "Selfie", url: pc.selfieWithId.url }]
                  : []
              }
            />
            <DocSection
              title="Proof of address (personal)"
              status={pc.proofOfAddress?.status}
              rejectionReason={pc.proofOfAddress?.rejectionReason}
              images={
                pc.proofOfAddress?.url
                  ? [
                      {
                        label: pc.proofOfAddress.fileName || "Document",
                        url: pc.proofOfAddress.url,
                      },
                    ]
                  : []
              }
              meta={pc.proofOfAddress?.type}
            />
          </div>
        </div>

        {isBusiness && (
          <div className="rounded-xl border border-[#E4E7EC] bg-white p-5 mb-5">
            <h3 className="text-sm font-semibold text-[#1B1F27] mb-3">
              Business verification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocSection
                title="Registration extract"
                status={biz.registrationExtract?.status}
                rejectionReason={biz.registrationExtract?.rejectionReason}
                images={
                  biz.registrationExtract?.url
                    ? [
                        {
                          label: biz.registrationExtract.fileName || "Document",
                          url: biz.registrationExtract.url,
                        },
                      ]
                    : []
                }
              />
              <DocSection
                title="Letter of authorization"
                status={biz.letterOfAuthorization?.status}
                rejectionReason={biz.letterOfAuthorization?.rejectionReason}
                images={
                  biz.letterOfAuthorization?.url
                    ? [
                        {
                          label:
                            biz.letterOfAuthorization.fileName || "Document",
                          url: biz.letterOfAuthorization.url,
                        },
                      ]
                    : []
                }
              />
              <DocSection
                title="Proof of address (business)"
                status={biz.proofOfAddress?.status}
                rejectionReason={biz.proofOfAddress?.rejectionReason}
                images={
                  biz.proofOfAddress?.url
                    ? [
                        {
                          label: biz.proofOfAddress.fileName || "Document",
                          url: biz.proofOfAddress.url,
                        },
                      ]
                    : []
                }
                meta={biz.proofOfAddress?.type}
              />
            </div>
          </div>
        )}

        <div className="rounded-xl border border-[#E4E7EC] bg-white p-5 mb-5">
          <h3 className="text-sm font-semibold text-[#1B1F27] mb-3">
            Bank account
          </h3>
          {!participation?.bankAccount ? (
            <p className="text-xs text-[#9CA3AF] italic">Not provided</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div>
                  <InfoRow
                    label="Account holder"
                    value={participation.bankAccount.accountHolderName}
                  />
                  <InfoRow
                    label="Bank"
                    value={participation.bankAccount.bankName}
                  />
                  <InfoRow
                    label="Country"
                    value={participation.bankAccount.country}
                  />
                  <InfoRow
                    label="Account number"
                    value={
                      participation.bankAccount.accountNumber
                        ? `••••${String(participation.bankAccount.accountNumber).slice(-4)}`
                        : "—"
                    }
                  />
                </div>
                <div>
                  <InfoRow
                    label="Status"
                    value={
                      <StatusPill
                        status={participation.bankAccount.verificationStatus}
                      />
                    }
                  />
                </div>
              </div>
              {participation.bankAccount.statementUrl && (
                <div className="mt-3">
                  <DocSection
                    title="Bank statement"
                    images={[
                      {
                        label:
                          participation.bankAccount.statementFileName ||
                          "Statement",
                        url: participation.bankAccount.statementUrl,
                      },
                    ]}
                  />
                </div>
              )}
              {participation.bankAccount.rejectionReason && (
                <p className="text-xs text-[#B42318] mt-2">
                  Rejection note: {participation.bankAccount.rejectionReason}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
