"use client";

import { useState } from "react";

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "decimal",
  "dropdown",
  "multi_select",
  "checkbox",
  "radio",
  "date",
];

const TYPES_REQUIRING_OPTIONS = ["dropdown", "multi_select", "radio"];
const APPLIES_TO_OPTIONS = ["NONE", "PARENT", "CHILD"];

const OPERATORS = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "greater_than",
  "less_than",
  "greater_than_or_equal",
  "less_than_or_equal",
  "is_empty",
  "is_not_empty",
  "in",
  "not_in",
];
const OPERATORS_NEEDING_VALUE = OPERATORS.filter(
  (o) => o !== "is_empty" && o !== "is_not_empty",
);

const label = "block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-1";
const input =
  "w-full rounded-md border border-[#D0D5DD] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]";
const disabledInput =
  "w-full rounded-md border border-[#D0D5DD] bg-[#F5F6F8] px-3 py-2 text-sm text-[#6B7280]";

const humanize = (s) =>
  String(s || "")
    .split("_")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

function buildInitialForm(initialData, defaultSection) {
  if (!initialData) {
    return {
      section: defaultSection || "product_details",
      fieldName: "",
      fieldKey: "",
      fieldKeyTouched: false,
      fieldType: "text",
      label: "",
      helpText: "",
      placeholder: "",
      isRequired: false,
      sortOrder: 0,
      appliesTo: ["NONE", "PARENT", "CHILD"],
      options: [],
      validation: {},
      defaultValue: "",
      conditionalLogic: { enabled: false, conditions: [], logicType: "AND" },
      isActive: true,
    };
  }
  return {
    section: initialData.section,
    fieldName: initialData.fieldName || "",
    fieldKey: initialData.fieldKey || "",
    fieldKeyTouched: true,
    fieldType: initialData.fieldType,
    label: initialData.label || "",
    helpText: initialData.helpText || "",
    placeholder: initialData.placeholder || "",
    isRequired: !!initialData.isRequired,
    sortOrder: initialData.sortOrder ?? 0,
    appliesTo: initialData.appliesTo?.length ? initialData.appliesTo : ["NONE", "PARENT", "CHILD"],
    options: initialData.options || [],
    validation: initialData.validation || {},
    defaultValue: initialData.defaultValue ?? "",
    conditionalLogic: initialData.conditionalLogic || { enabled: false, conditions: [], logicType: "AND" },
    isActive: initialData.isActive !== undefined ? initialData.isActive : true,
  };
}

export default function ProductTypeFieldForm({
  mode = "create",
  productType,
  initialData = null,
  defaultSection = "product_details",
  allFields = [],
  onSubmit,
  submitting = false,
  errorMessage = null,
}) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(() => buildInitialForm(initialData, defaultSection));
  const [errors, setErrors] = useState({});

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const needsOptions = TYPES_REQUIRING_OPTIONS.includes(form.fieldType);
  const isNumeric = form.fieldType === "number" || form.fieldType === "decimal";
  const isTextLike = form.fieldType === "text" || form.fieldType === "textarea";

  const conditionCandidates = allFields.filter(
    (f) => f.section === form.section && (!isEdit || f.fieldKey !== initialData?.fieldKey),
  );

  const toggleAppliesTo = (val) =>
    set({
      appliesTo: form.appliesTo.includes(val)
        ? form.appliesTo.filter((v) => v !== val)
        : [...form.appliesTo, val],
    });

  const updateOption = (idx, patch) =>
    set({ options: form.options.map((o, i) => (i === idx ? { ...o, ...patch } : o)) });
  const addOption = () =>
    set({ options: [...form.options, { label: "", value: "", isDefault: false }] });
  const removeOption = (idx) => set({ options: form.options.filter((_, i) => i !== idx) });

  const updateCondition = (idx, patch) =>
    set({
      conditionalLogic: {
        ...form.conditionalLogic,
        conditions: form.conditionalLogic.conditions.map((c, i) =>
          i === idx ? { ...c, ...patch } : c,
        ),
      },
    });
  const addCondition = () =>
    set({
      conditionalLogic: {
        ...form.conditionalLogic,
        conditions: [
          ...form.conditionalLogic.conditions,
          { fieldKey: "", operator: "equals", value: "" },
        ],
      },
    });
  const removeCondition = (idx) =>
    set({
      conditionalLogic: {
        ...form.conditionalLogic,
        conditions: form.conditionalLogic.conditions.filter((_, i) => i !== idx),
      },
    });

  const validate = () => {
    const next = {};
    if (!form.fieldName.trim()) next.fieldName = "Field name is required";
    if (!form.label.trim()) next.label = "Label is required";
    if (form.fieldKey && !/^[a-z0-9_]+$/.test(form.fieldKey)) {
      next.fieldKey = "Only lowercase letters, numbers and underscores allowed";
    }

    if (needsOptions) {
      if (!form.options.length) {
        next.options = `Field type "${form.fieldType}" requires at least one option`;
      } else {
        const values = form.options.map((o) => o.value.trim());
        if (values.some((v) => !v)) next.options = "Every option needs a value";
        const dupes = values.filter((v, i) => v && values.indexOf(v) !== i);
        if (dupes.length) next.options = `Duplicate option values: ${[...new Set(dupes)].join(", ")}`;
        if (form.options.some((o) => !o.label.trim())) next.options = "Every option needs a label";
      }
    }

    if (isNumeric) {
      const { minValue, maxValue } = form.validation;
      if (minValue !== undefined && minValue !== "" && maxValue !== undefined && maxValue !== "") {
        if (Number(minValue) > Number(maxValue)) next.validation = "Minimum value cannot exceed maximum value";
      }
    }
    if (isTextLike) {
      const { minLength, maxLength } = form.validation;
      if (minLength !== undefined && minLength !== "" && maxLength !== undefined && maxLength !== "") {
        if (Number(minLength) > Number(maxLength)) next.validation = "Minimum length cannot exceed maximum length";
      }
    }
    if (form.validation.pattern) {
      try {
        new RegExp(form.validation.pattern);
      } catch {
        next.validation = "Invalid regular expression pattern";
      }
    }

    if (form.conditionalLogic.enabled) {
      if (!form.conditionalLogic.conditions.length) {
        next.conditionalLogic = "Add at least one condition or turn conditional logic off";
      } else {
        for (const c of form.conditionalLogic.conditions) {
          if (!c.fieldKey) {
            next.conditionalLogic = "Every condition needs a source field";
            break;
          }
          if (OPERATORS_NEEDING_VALUE.includes(c.operator) && (c.value === undefined || c.value === "")) {
            next.conditionalLogic = `Condition with operator "${c.operator}" requires a value`;
            break;
          }
        }
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const cleanValidation = () => {
    const v = form.validation || {};
    const out = {};
    if (isTextLike) {
      if (v.minLength !== undefined && v.minLength !== "") out.minLength = Number(v.minLength);
      if (v.maxLength !== undefined && v.maxLength !== "") out.maxLength = Number(v.maxLength);
    }
    if (isNumeric) {
      if (v.minValue !== undefined && v.minValue !== "") out.minValue = Number(v.minValue);
      if (v.maxValue !== undefined && v.maxValue !== "") out.maxValue = Number(v.maxValue);
    }
    if (v.pattern) out.pattern = v.pattern;
    if (v.patternMessage) out.patternMessage = v.patternMessage;
    if (v.customMessage) out.customMessage = v.customMessage;
    return out;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      section: form.section,
      fieldName: form.fieldName.trim(),
      fieldType: form.fieldType,
      label: form.label.trim(),
      helpText: form.helpText.trim(),
      placeholder: form.placeholder.trim(),
      isRequired: form.isRequired,
      sortOrder: Number(form.sortOrder) || 0,
      appliesTo: form.appliesTo,
      options: needsOptions
        ? form.options.map((o) => ({ ...o, value: o.value.trim(), label: o.label.trim() }))
        : [],
      validation: cleanValidation(),
      conditionalLogic: form.conditionalLogic.enabled
        ? form.conditionalLogic
        : { enabled: false, conditions: [] },
      isActive: form.isActive,
    };

    if (form.defaultValue !== "" && form.defaultValue !== null && form.defaultValue !== undefined) {
      payload.defaultValue = form.defaultValue;
    }

    if (!isEdit) {
      payload.productType = productType;
      if (form.fieldKey.trim()) payload.fieldKey = form.fieldKey.trim();
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="rounded-md border border-[#FDA29B] bg-[#FEF3F2] px-3 py-2 text-sm text-[#B42318]">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Product type</label>
          <input type="text" value={productType} disabled className={disabledInput} />
        </div>
        <div>
          <label className={label}>Section</label>
          {isEdit ? (
            <input type="text" value={humanize(form.section)} disabled className={disabledInput} />
          ) : (
            <select
              value={form.section}
              onChange={(e) => set({ section: e.target.value })}
              className={`${input} bg-white`}
            >
              <option value="product_details">Product details</option>
              <option value="safety_compliance">Safety & compliance</option>
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Field name</label>
          <input
            type="text"
            value={form.fieldName}
            onChange={(e) => {
              const v = e.target.value;
              set({
                fieldName: v,
                fieldKey: !isEdit && !form.fieldKeyTouched ? slugify(v) : form.fieldKey,
              });
            }}
            placeholder="e.g. Sole Material"
            className={input}
          />
          {errors.fieldName && <p className="text-[#B42318] text-xs mt-1">{errors.fieldName}</p>}
        </div>
        <div>
          <label className={label}>Field key</label>
          <input
            type="text"
            value={form.fieldKey}
            disabled={isEdit}
            onChange={(e) => set({ fieldKey: slugify(e.target.value), fieldKeyTouched: true })}
            placeholder="auto-generated from field name"
            className={isEdit ? disabledInput : input}
          />
          {errors.fieldKey && <p className="text-[#B42318] text-xs mt-1">{errors.fieldKey}</p>}
          {isEdit && (
            <p className="text-[10px] text-[#9CA3AF] mt-1">
              Field key cannot change — product data is stored under it.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Field type</label>
          <select
            value={form.fieldType}
            onChange={(e) => set({ fieldType: e.target.value })}
            className={`${input} bg-white`}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {humanize(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Label (shown to sellers)</label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => set({ label: e.target.value })}
            placeholder="e.g. Sole material"
            className={input}
          />
          {errors.label && <p className="text-[#B42318] text-xs mt-1">{errors.label}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Help text</label>
          <input
            type="text"
            value={form.helpText}
            onChange={(e) => set({ helpText: e.target.value })}
            className={input}
          />
        </div>
        <div>
          <label className={label}>Placeholder</label>
          <input
            type="text"
            value={form.placeholder}
            onChange={(e) => set({ placeholder: e.target.value })}
            className={input}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-end">
        <label className="flex items-center gap-2 text-sm text-[#374151] pb-2">
          <input
            type="checkbox"
            checked={form.isRequired}
            onChange={(e) => set({ isRequired: e.target.checked })}
            className="rounded border-[#D0D5DD]"
          />
          Required
        </label>
        <div>
          <label className={label}>Sort order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set({ sortOrder: e.target.value })}
            className={input}
          />
        </div>
      </div>

      <div>
        <label className={label}>Applies to (product parentage)</label>
        <div className="flex gap-2">
          {APPLIES_TO_OPTIONS.map((opt) => {
            const active = form.appliesTo.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleAppliesTo(opt)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-[#2F5D9F] border-[#2F5D9F] text-white"
                    : "bg-white border-[#D0D5DD] text-[#374151] hover:border-[#2F5D9F]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {needsOptions && (
        <div>
          <label className={label}>Options</label>
          <div className="space-y-2">
            {form.options.map((opt, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                <input
                  type="text"
                  value={opt.label}
                  placeholder="Label"
                  onChange={(e) => updateOption(idx, { label: e.target.value })}
                  className={input}
                />
                <input
                  type="text"
                  value={opt.value}
                  placeholder="Value"
                  onChange={(e) => updateOption(idx, { value: e.target.value })}
                  className={input}
                />
                <label className="flex items-center gap-1 text-xs text-[#6B7280] whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={!!opt.isDefault}
                    onChange={(e) => updateOption(idx, { isDefault: e.target.checked })}
                    className="rounded border-[#D0D5DD]"
                  />
                  Default
                </label>
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="h-8 w-8 rounded-md border border-[#D0D5DD] text-[#B42318] hover:bg-[#FEF3F2]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-xs font-semibold text-[#2F5D9F] hover:text-[#1F3F73]"
          >
            + Add option
          </button>
          {errors.options && <p className="text-[#B42318] text-xs mt-1">{errors.options}</p>}
        </div>
      )}

      <div>
        <label className={label}>Validation</label>
        <div className="grid grid-cols-2 gap-3 rounded-md border border-[#EEF0F3] p-3">
          {isTextLike && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1">
                  Min length
                </label>
                <input
                  type="number"
                  value={form.validation.minLength ?? ""}
                  onChange={(e) => set({ validation: { ...form.validation, minLength: e.target.value } })}
                  className={input}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1">
                  Max length
                </label>
                <input
                  type="number"
                  value={form.validation.maxLength ?? ""}
                  onChange={(e) => set({ validation: { ...form.validation, maxLength: e.target.value } })}
                  className={input}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1">
                  Pattern (regex)
                </label>
                <input
                  type="text"
                  value={form.validation.pattern ?? ""}
                  onChange={(e) => set({ validation: { ...form.validation, pattern: e.target.value } })}
                  className={input}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1">
                  Pattern error message
                </label>
                <input
                  type="text"
                  value={form.validation.patternMessage ?? ""}
                  onChange={(e) => set({ validation: { ...form.validation, patternMessage: e.target.value } })}
                  className={input}
                />
              </div>
            </>
          )}
          {isNumeric && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1">
                  Min value
                </label>
                <input
                  type="number"
                  value={form.validation.minValue ?? ""}
                  onChange={(e) => set({ validation: { ...form.validation, minValue: e.target.value } })}
                  className={input}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-[#6B7280] mb-1">
                  Max value
                </label>
                <input
                  type="number"
                  value={form.validation.maxValue ?? ""}
                  onChange={(e) => set({ validation: { ...form.validation, maxValue: e.target.value } })}
                  className={input}
                />
              </div>
            </>
          )}
          {!isTextLike && !isNumeric && (
            <p className="col-span-2 text-xs text-[#9CA3AF] italic">
              No extra validation rules for this field type.
            </p>
          )}
        </div>
        {errors.validation && <p className="text-[#B42318] text-xs mt-1">{errors.validation}</p>}
      </div>

      <div>
        <label className={label}>Default value</label>
        {form.fieldType === "checkbox" ? (
          <label className="flex items-center gap-2 text-sm text-[#374151]">
            <input
              type="checkbox"
              checked={!!form.defaultValue}
              onChange={(e) => set({ defaultValue: e.target.checked })}
              className="rounded border-[#D0D5DD]"
            />
            Checked by default
          </label>
        ) : (
          <input
            type="text"
            value={form.defaultValue ?? ""}
            onChange={(e) => set({ defaultValue: e.target.value })}
            className={input}
          />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className={label}>Conditional logic</label>
          <label className="flex items-center gap-2 text-xs text-[#374151]">
            <input
              type="checkbox"
              checked={form.conditionalLogic.enabled}
              onChange={(e) =>
                set({
                  conditionalLogic: { ...form.conditionalLogic, enabled: e.target.checked },
                })
              }
              className="rounded border-[#D0D5DD]"
            />
            Enabled
          </label>
        </div>

        {form.conditionalLogic.enabled && (
          <div className="space-y-2 rounded-md border border-[#EEF0F3] p-3">
            {conditionCandidates.length === 0 && (
              <p className="text-xs text-[#9CA3AF] italic">
                No other fields exist in this section yet to condition on.
              </p>
            )}
            {form.conditionalLogic.conditions.map((c, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                <select
                  value={c.fieldKey}
                  onChange={(e) => updateCondition(idx, { fieldKey: e.target.value })}
                  className={`${input} bg-white`}
                >
                  <option value="">Field…</option>
                  {conditionCandidates.map((f) => (
                    <option key={f.fieldKey} value={f.fieldKey}>
                      {f.label} ({f.fieldKey})
                    </option>
                  ))}
                </select>
                <select
                  value={c.operator}
                  onChange={(e) => updateCondition(idx, { operator: e.target.value })}
                  className={`${input} bg-white`}
                >
                  {OPERATORS.map((op) => (
                    <option key={op} value={op}>
                      {humanize(op)}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={c.value ?? ""}
                  disabled={!OPERATORS_NEEDING_VALUE.includes(c.operator)}
                  onChange={(e) => updateCondition(idx, { value: e.target.value })}
                  placeholder={OPERATORS_NEEDING_VALUE.includes(c.operator) ? "Value" : "—"}
                  className={OPERATORS_NEEDING_VALUE.includes(c.operator) ? input : disabledInput}
                />
                <button
                  type="button"
                  onClick={() => removeCondition(idx)}
                  className="h-8 w-8 rounded-md border border-[#D0D5DD] text-[#B42318] hover:bg-[#FEF3F2]"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCondition}
              className="text-xs font-semibold text-[#2F5D9F] hover:text-[#1F3F73]"
            >
              + Add condition
            </button>

            {form.conditionalLogic.conditions.length > 1 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-[#6B7280]">Match</span>
                <select
                  value={form.conditionalLogic.logicType}
                  onChange={(e) =>
                    set({ conditionalLogic: { ...form.conditionalLogic, logicType: e.target.value } })
                  }
                  className="rounded-md border border-[#D0D5DD] px-2 py-1 text-xs bg-white"
                >
                  <option value="AND">All conditions (AND)</option>
                  <option value="OR">Any condition (OR)</option>
                </select>
              </div>
            )}
          </div>
        )}
        {errors.conditionalLogic && (
          <p className="text-[#B42318] text-xs mt-1">{errors.conditionalLogic}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-[#374151]">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set({ isActive: e.target.checked })}
          className="rounded border-[#D0D5DD]"
        />
        Active
      </label>

      <div className="flex items-center justify-end gap-3 border-t border-[#EEF0F3] pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[#2F5D9F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F3F73] disabled:opacity-50"
        >
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create field"}
        </button>
      </div>
    </form>
  );
}
