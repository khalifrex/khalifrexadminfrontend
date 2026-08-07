"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchBrowseNodeRoots, fetchBrowseNodeChildren, createBrowseNode, makeBrowseNodeSellable } from "@/app/api/browseNodeApi";
import { fetchProductTypes } from "@/app/api/productTypeApi";
import { fetchProductCategories } from "@/app/api/productCategoryApi";
import { flattenCategories } from "@/app/utils/flattenCategories";
import ImageUploadField from "@/app/components/ImageUploadField";

const label = "block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280] mb-1";
const input =
  "w-full rounded-md border border-[#D0D5DD] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]";

async function fetchFullTree() {
  const roots = await fetchBrowseNodeRoots();
  const attach = async (node) => {
    if (node.hasChildren) {
      const kids = await fetchBrowseNodeChildren(node.browseNodeId);
      await Promise.all(kids.map(attach));
      node.children = kids;
    } else {
      node.children = [];
    }
    return node;
  };
  await Promise.all(roots.map(attach));
  return roots;
}

function Badge({ children, tone = "blue" }) {
  const tones = {
    blue: "bg-[#EEF2FB] text-[#2F5D9F]",
    gray: "bg-[#F2F4F7] text-[#6B7280]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function AddChildForm({ parentNodeId, parentName, productTypes, categories, onDone, onCancel }) {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [showImage, setShowImage] = useState(false);
  const [sellable, setSellable] = useState(false);
  const [productType, setProductType] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (sellable && (!productType || !productCategory)) {
      setError("Product type and category are required for a sellable node");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createBrowseNode({
        name: name.trim(),
        parentNodeIds: parentNodeId ? [parentNodeId] : [],
        image: image.trim() || null,
      });
      if (sellable) {
        await makeBrowseNodeSellable(created.browseNodeId, { productType, productCategory });
      }
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="my-1.5 rounded-md border border-[#D0D9EE] bg-[#F8FAFF] p-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={parentNodeId ? `New child of "${parentName}"` : "New top-level node name"}
          className={`${input} flex-1`}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[#2F5D9F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1F3F73] disabled:opacity-50 whitespace-nowrap"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2 py-1.5 text-xs text-[#6B7280] hover:bg-[#EEF0F3]"
        >
          Cancel
        </button>
      </div>
      {showImage ? (
        <ImageUploadField value={image} onChange={setImage} />
      ) : (
        <button
          type="button"
          onClick={() => setShowImage(true)}
          className="text-xs font-semibold text-[#2F5D9F] hover:text-[#1F3F73]"
        >
          + Add image
        </button>
      )}
      <label className="flex items-center gap-2 text-xs text-[#374151]">
        <input
          type="checkbox"
          checked={sellable}
          onChange={(e) => setSellable(e.target.checked)}
          className="rounded border-[#D0D5DD]"
        />
        Make sellable immediately
      </label>
      {sellable && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Product type</label>
            <select value={productType} onChange={(e) => setProductType(e.target.value)} className={`${input} bg-white`}>
              <option value="">Select…</option>
              {productTypes.map((t) => (
                <option key={t.productTypeId || t.name} value={t.name}>
                  {t.displayName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Product category</label>
            <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className={`${input} bg-white`}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {"— ".repeat(c.depth)}
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {error && <p className="text-[#B42318] text-xs">{error}</p>}
    </form>
  );
}

function MakeSellableForm({ node, productTypes, categories, onDone, onCancel }) {
  const [productType, setProductType] = useState(node.productType || "");
  const [productCategory, setProductCategory] = useState(node.productCategory || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!productType || !productCategory) {
      setError("Product type and category are both required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await makeBrowseNodeSellable(node.browseNodeId, { productType, productCategory });
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="my-1.5 rounded-md border border-[#D0D9EE] bg-[#F8FAFF] p-3 space-y-2"
    >
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Product type</label>
          <select value={productType} onChange={(e) => setProductType(e.target.value)} className={`${input} bg-white`}>
            <option value="">Select…</option>
            {productTypes.map((t) => (
              <option key={t.productTypeId || t.name} value={t.name}>
                {t.displayName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Product category</label>
          <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className={`${input} bg-white`}>
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.code} value={c.code}>
                {"— ".repeat(c.depth)}
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[#2F5D9F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1F3F73] disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md px-2 py-1.5 text-xs text-[#6B7280] hover:bg-[#EEF0F3]">
          Cancel
        </button>
      </div>
      {error && <p className="text-[#B42318] text-xs">{error}</p>}
    </form>
  );
}

function TreeNode({ node, depth, productTypes, categories, onChanged }) {
  const [expanded, setExpanded] = useState(true);
  const [addingChild, setAddingChild] = useState(false);
  const [settingSellable, setSettingSellable] = useState(false);

  const hasKids = !!node.children?.length;
  const canBeSellable = !hasKids;

  return (
    <div>
      <div
        className="flex items-center justify-between gap-3 py-2 border-b border-[#EEF0F3] last:border-b-0"
        style={{ paddingLeft: `${depth * 22}px` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={`h-5 w-5 shrink-0 flex items-center justify-center text-[10px] text-[#6B7280] ${
              hasKids ? "cursor-pointer" : "opacity-0 cursor-default"
            }`}
          >
            {expanded ? "▾" : "▸"}
          </button>
          <span className="font-medium text-sm text-[#1B1F27] truncate">{node.name}</span>
          <span className="font-mono text-[11px] text-[#9CA3AF]">{node.browseNodeId}</span>
          {node.isSellable && <Badge>Sellable · {node.productType}</Badge>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canBeSellable && !node.isSellable && (
            <button
              type="button"
              onClick={() => setSettingSellable((v) => !v)}
              className="rounded-md border border-[#D0D5DD] px-2.5 py-1 text-xs font-semibold text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
            >
              Make sellable
            </button>
          )}
          <button
            type="button"
            onClick={() => setAddingChild((v) => !v)}
            className="rounded-md border border-[#D0D5DD] px-2.5 py-1 text-xs font-semibold text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
          >
            + Add child
          </button>
          <Link
            href={`/catalog/product-category/browse-node/${encodeURIComponent(node.browseNodeId)}`}
            className="rounded-md border border-[#D0D5DD] px-2.5 py-1 text-xs font-semibold text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
          >
            Edit
          </Link>
        </div>
      </div>

      {settingSellable && (
        <div style={{ paddingLeft: `${(depth + 1) * 22}px` }}>
          <MakeSellableForm
            node={node}
            productTypes={productTypes}
            categories={categories}
            onCancel={() => setSettingSellable(false)}
            onDone={async () => {
              setSettingSellable(false);
              await onChanged();
            }}
          />
        </div>
      )}

      {addingChild && (
        <div style={{ paddingLeft: `${(depth + 1) * 22}px` }}>
          <AddChildForm
            parentNodeId={node.browseNodeId}
            parentName={node.name}
            productTypes={productTypes}
            categories={categories}
            onCancel={() => setAddingChild(false)}
            onDone={async () => {
              setAddingChild(false);
              setExpanded(true);
              await onChanged();
            }}
          />
        </div>
      )}

      {expanded &&
        node.children?.map((c) => (
          <TreeNode
            key={c.browseNodeId}
            node={c}
            depth={depth + 1}
            productTypes={productTypes}
            categories={categories}
            onChanged={onChanged}
          />
        ))}
    </div>
  );
}

export default function BrowseNodePage() {
  const [tree, setTree] = useState(null);
  const [error, setError] = useState(null);
  const [productTypes, setProductTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [addingRoot, setAddingRoot] = useState(false);

  const load = useCallback(async () => {
    try {
      const t = await fetchFullTree();
      setTree(t);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    fetchProductTypes({ includeInactive: false }).then(setProductTypes).catch(() => {});
    fetchProductCategories({ includeInactive: false })
      .then((t) => setCategories(flattenCategories(t)))
      .catch(() => {});
  }, [load]);

  const loading = tree === null && !error;

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-[#1B1F27]">Browse nodes</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            The full category tree — expand any branch, add a child directly under it to build out a
            chain, or make a leaf sellable. Use "Edit" for renaming, multiple parents, or deleting.
          </p>
        </header>

        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAddingRoot((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#2F5D9F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F3F73]"
          >
            <span className="text-base leading-none">+</span> Add root node
          </button>
          <Link
            href="/catalog/product-category/browse-node/create"
            className="rounded-md border border-[#D0D5DD] px-4 py-2 text-sm font-semibold text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
          >
            Advanced create (multiple parents, image, sort order…)
          </Link>
        </div>

        {addingRoot && (
          <div className="mb-4">
            <AddChildForm
              parentNodeId={null}
              parentName={null}
              productTypes={productTypes}
              categories={categories}
              onCancel={() => setAddingRoot(false)}
              onDone={async () => {
                setAddingRoot(false);
                await load();
              }}
            />
          </div>
        )}

        <div className="rounded-xl border border-[#E4E7EC] bg-white px-4 py-2">
          {loading && (
            <p className="py-6 text-center text-sm text-[#6B7280]">Loading browse node tree…</p>
          )}
          {error && <p className="py-6 text-center text-sm text-[#B42318]">{error}</p>}
          {!loading && !error && (tree || []).length === 0 && (
            <p className="py-6 text-center text-sm text-[#6B7280]">No browse nodes yet.</p>
          )}
          {!loading &&
            !error &&
            (tree || []).map((root) => (
              <TreeNode
                key={root.browseNodeId}
                node={root}
                depth={0}
                productTypes={productTypes}
                categories={categories}
                onChanged={load}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
