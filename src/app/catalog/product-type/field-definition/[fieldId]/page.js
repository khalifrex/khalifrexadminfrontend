"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchProductTypeFields } from "@/app/api/productTypeApi";
import {
  updateProductTypeField,
  deleteProductTypeField,
} from "@/app/api/productTypeFieldApi";
import ProductTypeFieldForm from "@/app/components/ProductTypeFieldForm";

export default function EditProductTypeFieldPage() {
  return (
    <Suspense>
      <EditProductTypeFieldPageInner />
    </Suspense>
  );
}

function EditProductTypeFieldPageInner() {
  const { fieldId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productType = searchParams.get("productType") || "";

  const [allFields, setAllFields] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!productType) {
      setLoadError("Missing productType — go back to the field list and open this field from there.");
      return;
    }
    let ignore = false;
    fetchProductTypeFields(productType)
      .then((data) => {
        if (!ignore) setAllFields(data.fields || []);
      })
      .catch((err) => !ignore && setLoadError(err.message));
    return () => {
      ignore = true;
    };
  }, [productType]);

  const field = allFields?.find((f) => f._id === fieldId);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await updateProductTypeField(fieldId, payload);
      router.push(`/catalog/product-type/field-definition?productType=${encodeURIComponent(productType)}`);
    } catch (err) {
      setSubmitError(err.details?.join(", ") || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete field "${field.label}"? This cannot be undone.`)) return;
    setDeleting(true);
    setSubmitError(null);
    try {
      await deleteProductTypeField(fieldId);
      router.push(`/catalog/product-type/field-definition?productType=${encodeURIComponent(productType)}`);
    } catch (err) {
      setSubmitError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link
          href={`/catalog/product-type/field-definition${productType ? `?productType=${encodeURIComponent(productType)}` : ""}`}
          className="text-sm text-[#6B7280] hover:text-[#2F5D9F] mb-4 inline-block"
        >
          ← Back to fields
        </Link>

        <div className="rounded-xl border border-[#E4E7EC] bg-white px-6 py-5">
          {loadError && <p className="text-sm text-[#B42318]">{loadError}</p>}
          {!loadError && allFields === null && (
            <p className="text-sm text-[#6B7280]">Loading…</p>
          )}
          {!loadError && allFields !== null && !field && (
            <p className="text-sm text-[#B42318]">Field not found.</p>
          )}

          {field && (
            <>
              <div className="flex items-start justify-between mb-1">
                <h1 className="text-lg font-semibold text-[#1B1F27]">Edit field</h1>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-md border border-[#FDA29B] px-3 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-[#FEF3F2] disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete field"}
                </button>
              </div>
              <p className="text-xs text-[#6B7280] mb-5">
                Product type, section and field key are locked once a field exists.
              </p>
              <ProductTypeFieldForm
                mode="edit"
                productType={productType}
                initialData={field}
                allFields={allFields}
                onSubmit={handleSubmit}
                submitting={submitting}
                errorMessage={submitError}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
