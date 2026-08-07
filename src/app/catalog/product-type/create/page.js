"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProductType } from "@/app/api/productTypeApi";
import TagListInput from "@/app/components/TagListInput";
import VariationThemesInput from "@/app/components/VariationThemesInput";

const label = "block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-1";
const input =
  "w-full rounded-md border border-[#D0D5DD] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]";

export default function CreateProductTypePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    displayName: "",
    exampleNames: [],
    variationThemes: [],
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    else if (!/^[a-zA-Z0-9_ -]+$/.test(form.name.trim()))
      next.name = "Use letters, numbers, spaces, underscores or hyphens only";
    if (!form.displayName.trim()) next.displayName = "Display name is required";
    for (let i = 0; i < form.variationThemes.length; i++) {
      if (!form.variationThemes[i].length) {
        next.variationThemes = "Remove empty variation theme groups or add at least one attribute";
        break;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createProductType({
        name: form.name.trim(),
        displayName: form.displayName.trim(),
        exampleNames: form.exampleNames,
        variationThemes: form.variationThemes,
        isActive: form.isActive,
      });
      router.push(`/catalog/product-type/${encodeURIComponent(created.name)}`);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link
          href="/catalog/product-type"
          className="text-sm text-[#6B7280] hover:text-[#2F5D9F] mb-4 inline-block"
        >
          ← Back to product types
        </Link>

        <div className="rounded-xl border border-[#E4E7EC] bg-white">
          <form onSubmit={handleSubmit}>
            <div className="border-b border-[#EEF0F3] px-6 py-4">
              <h1 className="text-lg font-semibold text-[#1B1F27]">Add new product type</h1>
              <p className="text-xs text-[#6B7280] mt-0.5">
                The name cannot be changed after creation.
              </p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {submitError && (
                <div className="rounded-md border border-[#FDA29B] bg-[#FEF3F2] px-3 py-2 text-sm text-[#B42318]">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Name (code)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="e.g. SHOES"
                    className={`${input} uppercase`}
                  />
                  {errors.name && (
                    <p className="text-[#B42318] text-xs mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className={label}>Display name</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => set({ displayName: e.target.value })}
                    placeholder="e.g. Shoes"
                    className={input}
                  />
                  {errors.displayName && (
                    <p className="text-[#B42318] text-xs mt-1">{errors.displayName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={label}>Example product names</label>
                <TagListInput
                  values={form.exampleNames}
                  onChange={(v) => set({ exampleNames: v })}
                  placeholder="e.g. Running shoes"
                />
              </div>

              <div>
                <label className={label}>Variation themes</label>
                <VariationThemesInput
                  themes={form.variationThemes}
                  onChange={(v) => set({ variationThemes: v })}
                />
                {errors.variationThemes && (
                  <p className="text-[#B42318] text-xs mt-1">{errors.variationThemes}</p>
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
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#EEF0F3] px-6 py-4">
              <Link
                href="/catalog/product-type"
                className="rounded-md px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F5F6F8]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-[#2F5D9F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F3F73] disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create product type"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
