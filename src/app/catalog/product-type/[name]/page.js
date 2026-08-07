"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchProductType,
  updateProductType,
  deleteProductType,
} from "@/app/api/productTypeApi";
import TagListInput from "@/app/components/TagListInput";
import VariationThemesInput from "@/app/components/VariationThemesInput";

const label = "block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-1";
const input =
  "w-full rounded-md border border-[#D0D5DD] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]";
const disabledInput =
  "w-full rounded-md border border-[#D0D5DD] bg-[#F5F6F8] px-3 py-2 text-sm text-[#6B7280]";

export default function EditProductTypePage() {
  const { name } = useParams();
  const router = useRouter();

  const [productType, setProductType] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchProductType(name);
        if (ignore) return;
        setProductType(data);
        setForm({
          displayName: data.displayName || "",
          exampleNames: data.exampleNames || [],
          variationThemes: data.variationThemes || [],
          isActive: data.isActive,
        });
        setLoadError(null);
      } catch (err) {
        if (!ignore) setLoadError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [name]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const next = {};
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
    setSuccess("");
    try {
      const updated = await updateProductType(name, {
        displayName: form.displayName.trim(),
        exampleNames: form.exampleNames,
        variationThemes: form.variationThemes,
        isActive: form.isActive,
      });
      setProductType(updated);
      setSuccess("Saved");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete product type "${name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setSubmitError(null);
    try {
      await deleteProductType(name);
      router.push("/catalog/product-type");
    } catch (err) {
      setSubmitError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <p className="text-sm text-[#6B7280]">Loading…</p>
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <p className="text-sm text-[#B42318]">{loadError || "Product type not found"}</p>
      </div>
    );
  }

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
            <div className="flex items-start justify-between border-b border-[#EEF0F3] px-6 py-4">
              <div>
                <h1 className="text-lg font-semibold text-[#1B1F27]">{productType.displayName}</h1>
                <p className="text-xs text-[#6B7280] mt-0.5 font-mono">{productType.name}</p>
              </div>
              <Link
                href={`/catalog/product-type/field-definition?productType=${encodeURIComponent(name)}`}
                className="text-xs font-semibold text-[#2F5D9F] hover:text-[#1F3F73] whitespace-nowrap"
              >
                Manage fields →
              </Link>
            </div>

            <div className="px-6 py-5 space-y-5">
              {submitError && (
                <div className="rounded-md border border-[#FDA29B] bg-[#FEF3F2] px-3 py-2 text-sm text-[#B42318]">
                  {submitError}
                </div>
              )}
              {success && (
                <div className="rounded-md border border-[#A7E3B7] bg-[#DCFCE7] px-3 py-2 text-sm text-[#15803D]">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Name (code)</label>
                  <input type="text" value={productType.name} disabled className={disabledInput} />
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Name cannot be changed after creation.</p>
                </div>
                <div>
                  <label className={label}>Display name</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => set({ displayName: e.target.value })}
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

            <div className="flex items-center justify-between gap-3 border-t border-[#EEF0F3] px-6 py-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md border border-[#FDA29B] px-4 py-2 text-sm font-semibold text-[#B42318] hover:bg-[#FEF3F2] disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-[#2F5D9F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F3F73] disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
