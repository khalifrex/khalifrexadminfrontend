"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchProductTypes, fetchProductTypeFields } from "@/app/api/productTypeApi";
import { createProductTypeField } from "@/app/api/productTypeFieldApi";
import ProductTypeFieldForm from "@/app/components/ProductTypeFieldForm";

export default function CreateProductTypeFieldPage() {
  return (
    <Suspense>
      <CreateProductTypeFieldPageInner />
    </Suspense>
  );
}

function CreateProductTypeFieldPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProductType = searchParams.get("productType") || "";

  const [types, setTypes] = useState([]);
  const [productType, setProductType] = useState(initialProductType);
  const [allFields, setAllFields] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProductTypes({ includeInactive: true })
      .then(setTypes)
      .catch((err) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    if (!productType) {
      setAllFields([]);
      return;
    }
    fetchProductTypeFields(productType)
      .then((data) => setAllFields(data.fields || []))
      .catch(() => setAllFields([]));
  }, [productType]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const field = await createProductTypeField(payload);
      router.push(
        `/catalog/product-type/field-definition/${field._id}?productType=${encodeURIComponent(productType)}`,
      );
    } catch (err) {
      setSubmitError(err.details?.join(", ") || err.message);
    } finally {
      setSubmitting(false);
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
          <h1 className="text-lg font-semibold text-[#1B1F27] mb-1">Add product type field</h1>
          <p className="text-xs text-[#6B7280] mb-5">
            Field key cannot be changed once created — product data will be stored under it.
          </p>

          {loadError && <p className="text-sm text-[#B42318] mb-4">{loadError}</p>}

          {!productType ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Select a product type
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full rounded-md border border-[#D0D5DD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]"
              >
                <option value="">Select…</option>
                {types.map((t) => (
                  <option key={t.productTypeId || t.name} value={t.name}>
                    {t.displayName} ({t.name})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <ProductTypeFieldForm
              mode="create"
              productType={productType}
              allFields={allFields}
              onSubmit={handleSubmit}
              submitting={submitting}
              errorMessage={submitError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
