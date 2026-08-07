"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowseNode, fetchBrowseNode, makeBrowseNodeSellable } from "@/app/api/browseNodeApi";
import { fetchProductTypes } from "@/app/api/productTypeApi";
import { fetchProductCategories } from "@/app/api/productCategoryApi";
import BrowseNodeParentPicker from "@/app/components/BrowseNodeParentPicker";
import TagListInput from "@/app/components/TagListInput";
import ImageUploadField from "@/app/components/ImageUploadField";
import { flattenCategories } from "@/app/utils/flattenCategories";

const label = "block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-1";
const input =
  "w-full rounded-md border border-[#D0D5DD] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]";

export default function CreateBrowseNodePage() {
  return (
    <Suspense>
      <CreateBrowseNodePageInner />
    </Suspense>
  );
}

function CreateBrowseNodePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParentId = searchParams.get("parentNodeId") || "";
  const nodeCache = useMemo(() => new Map(), []);

  const [form, setForm] = useState({
    name: "",
    parentNodeIds: initialParentId ? [initialParentId] : [],
    image: "",
    sortOrder: 0,
    searchKeywords: [],
    itemTypeKeyword: "",
    isActive: true,
    sellable: false,
    productType: "",
    productCategory: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [productTypes, setProductTypes] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProductTypes({ includeInactive: false }).then(setProductTypes).catch(() => {});
    fetchProductCategories({ includeInactive: false })
      .then((tree) => setCategories(flattenCategories(tree)))
      .catch(() => {});
    if (initialParentId) {
      fetchBrowseNode(initialParentId)
        .then((n) => nodeCache.set(n.browseNodeId, n))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (form.sellable) {
      if (!form.productType) next.productType = "Product type is required for a sellable node";
      if (!form.productCategory) next.productCategory = "Product category is required for a sellable node";
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
      const node = await createBrowseNode({
        name: form.name.trim(),
        parentNodeIds: form.parentNodeIds,
        image: form.image.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        searchKeywords: form.searchKeywords,
        itemTypeKeyword: form.itemTypeKeyword.trim() || null,
        isActive: form.isActive,
      });

      if (form.sellable) {
        await makeBrowseNodeSellable(node.browseNodeId, {
          productType: form.productType,
          productCategory: form.productCategory,
          itemTypeKeyword: form.itemTypeKeyword.trim() || undefined,
        });
      }

      router.push(`/catalog/product-category/browse-node/${encodeURIComponent(node.browseNodeId)}`);
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
          href="/catalog/product-category/browse-node"
          className="text-sm text-[#6B7280] hover:text-[#2F5D9F] mb-4 inline-block"
        >
          ← Back to browse nodes
        </Link>

        <div className="rounded-xl border border-[#E4E7EC] bg-white">
          <form onSubmit={handleSubmit}>
            <div className="border-b border-[#EEF0F3] px-6 py-4">
              <h1 className="text-lg font-semibold text-[#1B1F27]">Add browse node</h1>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Leave parents empty to create a top-level (root) node.
              </p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {submitError && (
                <div className="rounded-md border border-[#FDA29B] bg-[#FEF3F2] px-3 py-2 text-sm text-[#B42318]">
                  {submitError}
                </div>
              )}

              <div>
                <label className={label}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="e.g. Running Shoes"
                  className={input}
                />
                {errors.name && <p className="text-[#B42318] text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className={label}>Parent nodes</label>
                <BrowseNodeParentPicker
                  selected={form.parentNodeIds}
                  onChange={(v) => set({ parentNodeIds: v })}
                  nodeCache={nodeCache}
                />
              </div>

              <div>
                <label className={label}>Image</label>
                <ImageUploadField value={form.image} onChange={(v) => set({ image: v })} />
              </div>

              <div>
                <label className={label}>Sort order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set({ sortOrder: e.target.value })}
                  className={`${input} max-w-[160px]`}
                />
              </div>

              <div>
                <label className={label}>Search keywords</label>
                <TagListInput
                  values={form.searchKeywords}
                  onChange={(v) => set({ searchKeywords: v })}
                  placeholder="e.g. sneakers"
                />
              </div>

              <div>
                <label className={label}>Item type keyword</label>
                <input
                  type="text"
                  value={form.itemTypeKeyword}
                  onChange={(e) => set({ itemTypeKeyword: e.target.value })}
                  className={input}
                />
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

              <div className="rounded-md border border-[#EEF0F3] p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-[#1B1F27]">
                  <input
                    type="checkbox"
                    checked={form.sellable}
                    onChange={(e) => set({ sellable: e.target.checked })}
                    className="rounded border-[#D0D5DD]"
                  />
                  Sellable leaf node
                </label>
                <p className="text-xs text-[#6B7280]">
                  Only nodes with no children can be sellable. Sellers list products directly under
                  sellable nodes.
                </p>
                {form.sellable && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Product type</label>
                      <select
                        value={form.productType}
                        onChange={(e) => set({ productType: e.target.value })}
                        className={`${input} bg-white`}
                      >
                        <option value="">Select…</option>
                        {productTypes.map((t) => (
                          <option key={t.productTypeId || t.name} value={t.name}>
                            {t.displayName} ({t.name})
                          </option>
                        ))}
                      </select>
                      {errors.productType && (
                        <p className="text-[#B42318] text-xs mt-1">{errors.productType}</p>
                      )}
                    </div>
                    <div>
                      <label className={label}>Product category</label>
                      <select
                        value={form.productCategory}
                        onChange={(e) => set({ productCategory: e.target.value })}
                        className={`${input} bg-white`}
                      >
                        <option value="">Select…</option>
                        {categories.map((c) => (
                          <option key={c.code} value={c.code}>
                            {"— ".repeat(c.depth)}
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {errors.productCategory && (
                        <p className="text-[#B42318] text-xs mt-1">{errors.productCategory}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#EEF0F3] px-6 py-4">
              <Link
                href="/catalog/product-category/browse-node"
                className="rounded-md px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F5F6F8]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-[#2F5D9F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F3F73] disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create browse node"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
