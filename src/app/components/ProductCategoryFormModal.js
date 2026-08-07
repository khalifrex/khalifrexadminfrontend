"use client";

import { useState } from "react";

const PRODUCT_ID_TYPES = ["UPC", "EAN", "ISBN", "GTIN"];

const humanize = (code) =>
  String(code || "")
    .split("_")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const emptyTier = () => ({ rate: 10, condition: "", threshold: "" });

function buildInitialForm(initialData) {
  if (!initialData) {
    return {
      code: "",
      name: "",
      parentCode: "",
      referralFeeTiers: [emptyTier()],
      minimumReferralFee: 0,
      closingFee: 0,
      conditionsAllowed: [],
      approvalRequired: false,
      approvalRequiredForConditions: [],
      productIdRequired: true,
      canRequestProductIdExemption: false,
      allowedProductIdTypes: ["UPC", "EAN"],
      isActive: true,
    };
  }

  const eff = initialData.effectiveRules || {};
  return {
    code: initialData.code || "",
    name: initialData.name || "",
    parentCode: initialData.parentCode || "",
    referralFeeTiers: initialData.referralFeeTiers?.length
      ? initialData.referralFeeTiers.map((t) => ({
          rate: t.rate,
          condition: t.condition || "",
          threshold: t.threshold ?? "",
        }))
      : eff.referralFeeTiers?.length
        ? eff.referralFeeTiers.map((t) => ({
            rate: t.rate,
            condition: t.condition || "",
            threshold: t.threshold ?? "",
          }))
        : [emptyTier()],
    minimumReferralFee:
      initialData.minimumReferralFee ?? eff.minimumReferralFee ?? 0,
    closingFee: initialData.closingFee ?? eff.closingFee ?? 0,
    conditionsAllowed:
      initialData.conditionsAllowed ?? eff.conditionsAllowed ?? [],
    approvalRequired:
      initialData.approvalRequired ?? eff.approvalRequired ?? false,
    approvalRequiredForConditions:
      initialData.approvalRequiredForConditions ??
      eff.approvalRequiredForConditions ??
      [],
    productIdRequired:
      initialData.productIdRequired ?? eff.productIdRequired ?? true,
    canRequestProductIdExemption:
      initialData.canRequestProductIdExemption ??
      eff.canRequestProductIdExemption ??
      false,
    allowedProductIdTypes: initialData.allowedProductIdTypes ??
      eff.allowedProductIdTypes ?? ["UPC", "EAN"],
    isActive: initialData.isActive ?? true,
  };
}

function BoolToggle({ label, description, value, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[#EEF0F3] last:border-b-0">
      <div className="pr-4">
        <p className="text-sm font-medium text-[#1B1F27]">{label}</p>
        {description && (
          <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
      <div
        className={`inline-flex rounded-lg border border-[#D0D5DD] overflow-hidden shrink-0 ${disabled ? "opacity-50" : ""}`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(false)}
          className={`px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
            !value
              ? "bg-[#B42318] text-white"
              : "bg-white text-[#6B7280] hover:bg-[#F5F6F8]"
          }`}
        >
          OFF
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(true)}
          className={`px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors border-l border-[#D0D5DD] ${
            value
              ? "bg-[#15803D] text-white"
              : "bg-white text-[#6B7280] hover:bg-[#F5F6F8]"
          }`}
        >
          ON
        </button>
      </div>
    </div>
  );
}

function ChipMultiSelect({
  options,
  selected,
  onToggle,
  disabled,
  emptyLabel,
}) {
  if (!options.length) {
    return (
      <p className="text-xs text-[#6B7280] italic">
        {emptyLabel || "No options available."}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onToggle(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              active
                ? "bg-[#2F5D9F] border-[#2F5D9F] text-white"
                : "bg-white border-[#D0D5DD] text-[#374151] hover:border-[#2F5D9F]"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FeeTierEditor({ tiers, onChange }) {
  const updateTier = (idx, patch) =>
    onChange(tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  const addTier = () => onChange([...tiers, emptyTier()]);
  const removeTier = (idx) => onChange(tiers.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {tiers.map((tier, idx) => (
        <div
          key={idx}
          className="grid grid-cols-[1fr_1.2fr_1fr_auto] gap-2 items-end"
        >
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1">
              Rate %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={tier.rate}
              onChange={(e) => updateTier(idx, { rate: e.target.value })}
              className="w-full rounded-md border border-[#D0D5DD] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1">
              Applies
            </label>
            <select
              value={tier.condition}
              onChange={(e) =>
                updateTier(idx, {
                  condition: e.target.value,
                  threshold: e.target.value ? tier.threshold : "",
                })
              }
              className="w-full rounded-md border border-[#D0D5DD] px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]"
            >
              <option value="">Flat (always)</option>
              <option value="up_to">Up to threshold</option>
              <option value="above">Above threshold</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1">
              Threshold
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tier.threshold}
              disabled={!tier.condition}
              placeholder={tier.condition ? "0.00" : "—"}
              onChange={(e) => updateTier(idx, { threshold: e.target.value })}
              className="w-full rounded-md border border-[#D0D5DD] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F] disabled:bg-[#F5F6F8] disabled:text-[#9CA3AF]"
            />
          </div>
          <button
            type="button"
            disabled={tiers.length === 1}
            onClick={() => removeTier(idx)}
            title="Remove tier"
            className="h-9 w-9 rounded-md border border-[#D0D5DD] text-[#B42318] text-base font-semibold hover:bg-[#FEF3F2] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addTier}
        className="text-xs font-semibold text-[#2F5D9F] hover:text-[#1F3F73]"
      >
        + Add fee tier
      </button>
    </div>
  );
}

export default function ProductCategoryFormModal({
  open,
  mode,
  parentOptions,
  eligibleConditions,
  initialData,
  onClose,
  onSubmit,
  submitting,
  errorMessage,
}) {
  const [form, setForm] = useState(() => buildInitialForm(initialData));

  if (!open) return null;

  const isEdit = mode === "edit";
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleInArray = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter((v) => v !== value)
        : [...f[key], value],
    }));

  const conditionOptions = eligibleConditions.map((c) => ({
    value: c,
    label: humanize(c),
  }));
  const productIdTypeOptions = PRODUCT_ID_TYPES.map((t) => ({
    value: t,
    label: t,
  }));

  const canSubmit = form.name.trim() && !submitting;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const cleanTiers = form.referralFeeTiers
      .filter((t) => t.rate !== "" && t.rate !== null)
      .map((t) => ({
        rate: Number(t.rate),
        condition: t.condition || null,
        threshold:
          t.condition && t.threshold !== "" ? Number(t.threshold) : null,
      }));

    const category = {
      name: form.name.trim(),
      referralFeeTiers: cleanTiers,
      minimumReferralFee:
        form.minimumReferralFee === "" ? 0 : Number(form.minimumReferralFee),
      closingFee: form.closingFee === "" ? 0 : Number(form.closingFee),
      conditionsAllowed: form.conditionsAllowed,
      approvalRequired: form.approvalRequired,
      approvalRequiredForConditions: form.approvalRequiredForConditions,
      productIdRequired: form.productIdRequired,
      canRequestProductIdExemption: form.canRequestProductIdExemption,
      allowedProductIdTypes: form.allowedProductIdTypes,
      isActive: form.isActive,
    };

    if (!isEdit) {
      category.parentCode = form.parentCode || null;
    }

    onSubmit({ code: form.code, category });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1B1F27]/50 px-4 py-8">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start justify-between border-b border-[#EEF0F3] px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1B1F27]">
                {isEdit ? "Edit product category" : "Add new product category"}
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {isEdit
                  ? "Code and parent are locked once a category exists."
                  : "The code is generated automatically. Blank fields inherit from the parent."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-[#6B7280] hover:bg-[#F5F6F8] hover:text-[#1B1F27]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
            {errorMessage && (
              <div className="rounded-md border border-[#FDA29B] bg-[#FEF3F2] px-3 py-2 text-sm text-[#B42318]">
                {errorMessage}
              </div>
            )}

            <section className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    value={isEdit ? form.code : "Generated on save"}
                    disabled
                    className="w-full rounded-md border border-[#D0D5DD] bg-[#F5F6F8] px-3 py-2 text-sm font-mono text-[#6B7280]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-1">
                    Name
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    placeholder="e.g. Electronics"
                    onChange={(e) => set({ name: e.target.value })}
                    className="w-full rounded-md border border-[#D0D5DD] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-1">
                  Parent category{" "}
                  <span className="normal-case font-normal text-[#9CA3AF]">
                    (optional — leave blank to make this a top-level category)
                  </span>
                </label>
                <select
                  value={form.parentCode}
                  disabled={isEdit}
                  onChange={(e) => set({ parentCode: e.target.value })}
                  className="w-full rounded-md border border-[#D0D5DD] px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F] disabled:bg-[#F5F6F8] disabled:text-[#6B7280]"
                >
                  <option value="">— None (top-level category) —</option>
                  {parentOptions.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-[#1B1F27] mb-2">
                Referral fees
              </h3>
              <FeeTierEditor
                tiers={form.referralFeeTiers}
                onChange={(t) => set({ referralFeeTiers: t })}
              />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1">
                    Minimum referral fee
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minimumReferralFee}
                    onChange={(e) =>
                      set({ minimumReferralFee: e.target.value })
                    }
                    className="w-full rounded-md border border-[#D0D5DD] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1">
                    Closing fee
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.closingFee}
                    onChange={(e) => set({ closingFee: e.target.value })}
                    className="w-full rounded-md border border-[#D0D5DD] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[#1B1F27]">
                Conditions & approval
              </h3>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1.5">
                  Conditions allowed
                </label>
                <ChipMultiSelect
                  options={conditionOptions}
                  selected={form.conditionsAllowed}
                  onToggle={(v) => toggleInArray("conditionsAllowed", v)}
                  emptyLabel="No eligible conditions returned by the catalog service."
                />
              </div>

              <BoolToggle
                label="Approval required to list"
                description="Sellers must be approved before listing in this category."
                value={form.approvalRequired}
                onChange={(v) => set({ approvalRequired: v })}
              />

              {form.approvalRequired && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1.5">
                    Conditions that require approval
                  </label>
                  <ChipMultiSelect
                    options={conditionOptions}
                    selected={form.approvalRequiredForConditions}
                    onToggle={(v) =>
                      toggleInArray("approvalRequiredForConditions", v)
                    }
                    emptyLabel="No eligible conditions returned by the catalog service."
                  />
                </div>
              )}
            </section>

            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-[#1B1F27] mb-1">
                Product ID rules
              </h3>
              <BoolToggle
                label="Product ID required"
                description="A UPC/EAN/ISBN/GTIN is required to list."
                value={form.productIdRequired}
                onChange={(v) => set({ productIdRequired: v })}
              />
              <BoolToggle
                label="Can request product ID exemption"
                description="Sellers may apply for an exemption from the requirement above."
                value={form.canRequestProductIdExemption}
                onChange={(v) => set({ canRequestProductIdExemption: v })}
              />
              <div className="pt-2">
                <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1.5">
                  Allowed product ID types
                </label>
                <ChipMultiSelect
                  options={productIdTypeOptions}
                  selected={form.allowedProductIdTypes}
                  onToggle={(v) => toggleInArray("allowedProductIdTypes", v)}
                />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-[#1B1F27] mb-1">
                Status
              </h3>
              <BoolToggle
                label="Active"
                description="Inactive categories can't be selected for new listings."
                value={form.isActive}
                onChange={(v) => set({ isActive: v })}
              />
            </section>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#EEF0F3] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F5F6F8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-[#2F5D9F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F3F73] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
