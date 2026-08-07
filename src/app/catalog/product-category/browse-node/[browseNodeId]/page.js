"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchBrowseNode,
  fetchBrowseNodeBreadcrumbs,
  renameBrowseNode,
  addBrowseNodeParent,
  removeBrowseNodeParent,
  updateBrowseNodeDetails,
  makeBrowseNodeSellable,
  toggleBrowseNodeStatus,
  deleteBrowseNode,
} from "@/app/api/browseNodeApi";
import { fetchProductTypes } from "@/app/api/productTypeApi";
import { fetchProductCategories } from "@/app/api/productCategoryApi";
import BrowseNodeParentPicker from "@/app/components/BrowseNodeParentPicker";
import TagListInput from "@/app/components/TagListInput";
import ImageUploadField from "@/app/components/ImageUploadField";
import { flattenCategories } from "@/app/utils/flattenCategories";

const label =
  "block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-1";
const input =
  "w-full rounded-md border border-[#D0D5DD] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]";
const disabledInput =
  "w-full rounded-md border border-[#D0D5DD] bg-[#F5F6F8] px-3 py-2 text-sm text-[#6B7280]";

export default function EditBrowseNodePage() {
  const { browseNodeId } = useParams();
  const router = useRouter();
  const nodeCache = useMemo(() => new Map(), []);

  const [node, setNode] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");

  const [productTypes, setProductTypes] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProductTypes({ includeInactive: false })
      .then(setProductTypes)
      .catch(() => {});
    fetchProductCategories({ includeInactive: false })
      .then((tree) => setCategories(flattenCategories(tree)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchBrowseNode(browseNodeId);
        if (ignore) return;
        setNode(data);

        fetchBrowseNodeBreadcrumbs(browseNodeId)
          .then((paths) => {
            for (const p of paths) {
              for (const t of p.trail) nodeCache.set(t.browseNodeId, t);
            }
          })
          .catch(() => {});
        setForm({
          name: data.name,
          parentNodeIds: data.parentNodeIds || [],
          image: data.image || "",
          sortOrder: data.sortOrder ?? 0,
          searchKeywords: data.searchKeywords || [],
          isActive: data.isActive,
          sellable: data.isSellable,
          productType: data.productType || "",
          productCategory: data.productCategory || "",
          itemTypeKeyword: data.itemTypeKeyword || "",
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
  }, [browseNodeId]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const canBeSellable = node && !node.hasChildren;

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (form.sellable) {
      if (!form.productType) next.productType = "Product type is required";
      if (!form.productCategory)
        next.productCategory = "Product category is required";
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
      let latest = node;

      if (form.name.trim() !== node.name) {
        latest = await renameBrowseNode(browseNodeId, form.name.trim());
      }

      const before = new Set(node.parentNodeIds || []);
      const after = new Set(form.parentNodeIds);
      for (const id of after) {
        if (!before.has(id))
          latest = await addBrowseNodeParent(browseNodeId, id);
      }
      for (const id of before) {
        if (!after.has(id))
          latest = await removeBrowseNodeParent(browseNodeId, id);
      }

      const searchKeywordsChanged =
        JSON.stringify(form.searchKeywords) !== JSON.stringify(node.searchKeywords || []);
      if (
        form.image !== (node.image || "") ||
        Number(form.sortOrder) !== (node.sortOrder ?? 0) ||
        searchKeywordsChanged
      ) {
        latest = await updateBrowseNodeDetails(browseNodeId, {
          image: form.image.trim() || null,
          sortOrder: Number(form.sortOrder) || 0,
          searchKeywords: form.searchKeywords,
        });
      }

      if (form.isActive !== node.isActive) {
        latest = await toggleBrowseNodeStatus(browseNodeId, form.isActive);
      }

      if (
        canBeSellable &&
        form.sellable &&
        (form.productType !== node.productType ||
          form.productCategory !== node.productCategory ||
          form.itemTypeKeyword !== (node.itemTypeKeyword || ""))
      ) {
        latest = await makeBrowseNodeSellable(browseNodeId, {
          productType: form.productType,
          productCategory: form.productCategory,
          itemTypeKeyword: form.itemTypeKeyword.trim() || undefined,
        });
      }

      setNode(latest);
      setForm({
        name: latest.name,
        parentNodeIds: latest.parentNodeIds || [],
        image: latest.image || "",
        sortOrder: latest.sortOrder ?? 0,
        searchKeywords: latest.searchKeywords || [],
        isActive: latest.isActive,
        sellable: latest.isSellable,
        productType: latest.productType || "",
        productCategory: latest.productCategory || "",
        itemTypeKeyword: latest.itemTypeKeyword || "",
      });
      setSuccess("Saved");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete browse node "${node.name}"? This cannot be undone.`))
      return;
    setDeleting(true);
    setSubmitError(null);
    try {
      await deleteBrowseNode(browseNodeId);
      router.push("/catalog/product-category/browse-node");
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
        <p className="text-sm text-[#B42318]">
          {loadError || "Browse node not found"}
        </p>
      </div>
    );
  }

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
              <h1 className="text-lg font-semibold text-[#1B1F27]">
                {node.name}
              </h1>
              <p className="text-xs text-[#6B7280] mt-0.5 font-mono">
                {node.browseNodeId}
              </p>
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

              <div>
                <label className={label}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  className={input}
                />
                {errors.name && (
                  <p className="text-[#B42318] text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className={label}>Parent nodes</label>
                <BrowseNodeParentPicker
                  selected={form.parentNodeIds}
                  onChange={(v) => set({ parentNodeIds: v })}
                  excludeNodeId={browseNodeId}
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
                <label
                  className={`flex items-center gap-2 text-sm font-medium ${
                    canBeSellable ? "text-[#1B1F27]" : "text-[#9CA3AF]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.sellable}
                    disabled={!canBeSellable}
                    onChange={(e) => set({ sellable: e.target.checked })}
                    className="rounded border-[#D0D5DD]"
                  />
                  Sellable leaf node
                </label>
                {!canBeSellable && (
                  <p className="text-xs text-[#9CA3AF]">
                    This node has children, so it can&apos;t be made sellable.
                  </p>
                )}
                {form.sellable && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Product type</label>
                      <select
                        value={form.productType}
                        disabled={!canBeSellable}
                        onChange={(e) => set({ productType: e.target.value })}
                        className={
                          canBeSellable ? `${input} bg-white` : disabledInput
                        }
                      >
                        <option value="">Select…</option>
                        {productTypes.map((t) => (
                          <option
                            key={t.productTypeId || t.name}
                            value={t.name}
                          >
                            {t.displayName} ({t.name})
                          </option>
                        ))}
                      </select>
                      {errors.productType && (
                        <p className="text-[#B42318] text-xs mt-1">
                          {errors.productType}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={label}>Product category</label>
                      <select
                        value={form.productCategory}
                        disabled={!canBeSellable}
                        onChange={(e) =>
                          set({ productCategory: e.target.value })
                        }
                        className={
                          canBeSellable ? `${input} bg-white` : disabledInput
                        }
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
                        <p className="text-[#B42318] text-xs mt-1">
                          {errors.productCategory}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className={label}>Item type keyword</label>
                      <input
                        type="text"
                        value={form.itemTypeKeyword}
                        disabled={!canBeSellable}
                        onChange={(e) =>
                          set({ itemTypeKeyword: e.target.value })
                        }
                        className={canBeSellable ? input : disabledInput}
                      />
                    </div>
                  </div>
                )}
              </div>
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
