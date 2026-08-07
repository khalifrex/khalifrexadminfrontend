"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchProductCategories,
  createProductCategory,
  updateProductCategory,
  fetchEligibleConditions,
} from "@/app/api/productCategoryApi";
import ProductCategoryFormModal from "@/app/components/ProductCategoryFormModal.js";

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F2F4F7] text-[#6B7280]"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function CategoryRow({ node, depth, onEdit }) {
  return (
    <>
      <div
        className="flex items-center justify-between gap-3 py-2.5 border-b border-[#EEF0F3] last:border-b-0"
        style={{ paddingLeft: `${depth * 24}px` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {depth > 0 && <span className="text-[#D0D5DD] select-none">↳</span>}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-[#1B1F27] truncate">
                {node.name}
              </span>
              <span className="font-mono text-[11px] text-[#6B7280]">
                {node.code}
              </span>
              <StatusBadge active={node.isActive} />
            </div>
            {node.parentCode && (
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                Parent: {node.parentCode}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEdit(node)}
          className="shrink-0 rounded-md border border-[#D0D5DD] px-3 py-1.5 text-xs font-semibold text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
        >
          Edit
        </button>
      </div>
      {node.children?.map((child) => (
        <CategoryRow
          key={child.code}
          node={child}
          depth={depth + 1}
          onEdit={onEdit}
        />
      ))}
    </>
  );
}

export default function ProductCategoryPage() {
  const [categories, setCategories] = useState(null);
  const [categoriesError, setCategoriesError] = useState(null);
  const [eligibleConditions, setEligibleConditions] = useState([]);

  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    initialData: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const categoriesLoading = categories === null && !categoriesError;

  const loadCategories = async () => {
    try {
      const tree = await fetchProductCategories({ includeInactive: true });
      setCategories(tree);
      setCategoriesError(null);
    } catch (err) {
      setCategoriesError(err.message);
    }
  };

  useEffect(() => {
    // setState happens only after an await inside loadCategories — not synchronous.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchEligibleConditions()
      .then((data) => {
        if (!cancelled) setEligibleConditions(data);
      })
      .catch(() => {
        if (!cancelled) setEligibleConditions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const parentOptions = useMemo(
    () => (categories || []).map((c) => ({ code: c.code, name: c.name })),
    [categories],
  );

  const openCreateModal = () => {
    setSubmitError(null);
    setModal({ open: true, mode: "create", initialData: null });
  };

  const openEditModal = (category) => {
    setSubmitError(null);
    setModal({ open: true, mode: "edit", initialData: category });
  };

  const closeModal = () => {
    if (submitting) return;
    setModal({ open: false, mode: "create", initialData: null });
  };

  const handleSubmit = async ({ code, category }) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      if (modal.mode === "edit") {
        await updateProductCategory(code, category);
      } else {
        await createProductCategory(category);
      }
      setModal({ open: false, mode: "create", initialData: null });
      await loadCategories();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const modalKey = modal.open
    ? `${modal.mode}-${modal.initialData?.code || "new"}`
    : "closed";

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-[#1B1F27]">
            Product categories
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage referral fee rules, condition eligibility, and product ID
            requirements by category.
          </p>
        </header>

        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#2F5D9F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F3F73] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-base leading-none">+</span> Add new product
            category
          </button>
          <Link
            href="/catalog/product-category/bulk"
            className="rounded-md border border-[#D0D5DD] px-4 py-2 text-sm font-semibold text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F]"
          >
            Bulk create
          </Link>
        </div>

        <div className="rounded-xl border border-[#E4E7EC] bg-white px-4 py-2">
          {categoriesLoading && (
            <p className="py-6 text-center text-sm text-[#6B7280]">
              Loading categories…
            </p>
          )}
          {categoriesError && (
            <p className="py-6 text-center text-sm text-[#B42318]">
              {categoriesError}
            </p>
          )}
          {!categoriesLoading &&
            !categoriesError &&
            (categories || []).length === 0 && (
              <p className="py-6 text-center text-sm text-[#6B7280]">
                No product categories yet.
              </p>
            )}
          {!categoriesLoading &&
            !categoriesError &&
            (categories || []).map((root) => (
              <CategoryRow
                key={root.code}
                node={root}
                depth={0}
                onEdit={openEditModal}
              />
            ))}
        </div>
      </div>

      <ProductCategoryFormModal
        key={modalKey}
        open={modal.open}
        mode={modal.mode}
        parentOptions={parentOptions}
        eligibleConditions={eligibleConditions}
        initialData={modal.initialData}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={submitting}
        errorMessage={submitError}
      />
    </div>
  );
}
