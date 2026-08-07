"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchProductTypes } from "@/app/api/productTypeApi";
import { fetchProductTypeFields } from "@/app/api/productTypeApi";

const SECTIONS = [
  { value: "product_details", label: "Product details" },
  { value: "safety_compliance", label: "Safety & compliance" },
];

export default function FieldDefinitionPage() {
  return (
    <Suspense>
      <FieldDefinitionPageInner />
    </Suspense>
  );
}

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-[#F2F4F7] text-[#6B7280]",
    green: "bg-[#DCFCE7] text-[#15803D]",
    blue: "bg-[#EEF2FB] text-[#2F5D9F]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function FieldDefinitionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedType = searchParams.get("productType") || "";

  const [types, setTypes] = useState([]);
  const [typesError, setTypesError] = useState(null);
  const [fields, setFields] = useState(null);
  const [fieldsError, setFieldsError] = useState(null);

  useEffect(() => {
    fetchProductTypes({ includeInactive: true })
      .then(setTypes)
      .catch((err) => setTypesError(err.message));
  }, []);

  const loadFields = useCallback(async (name) => {
    if (!name) {
      setFields(null);
      return;
    }
    try {
      const data = await fetchProductTypeFields(name);
      setFields(data.fields || []);
      setFieldsError(null);
    } catch (err) {
      setFieldsError(err.message);
      setFields(null);
    }
  }, []);

  useEffect(() => {
    loadFields(selectedType);
  }, [selectedType, loadFields]);

  const onSelectType = (name) => {
    router.push(
      name
        ? `/catalog/product-type/field-definition?productType=${encodeURIComponent(name)}`
        : "/catalog/product-type/field-definition",
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-[#1B1F27]">Product type fields</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Define the form fields sellers fill in for each product type.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => onSelectType(e.target.value)}
            className="min-w-[240px] rounded-md border border-[#D0D5DD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]"
          >
            <option value="">Select a product type…</option>
            {types.map((t) => (
              <option key={t.productTypeId || t.name} value={t.name}>
                {t.displayName} ({t.name})
              </option>
            ))}
          </select>

          {selectedType && (
            <Link
              href={`/catalog/product-type/field-definition/create?productType=${encodeURIComponent(selectedType)}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#2F5D9F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F3F73]"
            >
              <span className="text-base leading-none">+</span> Add field
            </Link>
          )}
        </div>

        {typesError && <p className="text-sm text-[#B42318] mb-3">{typesError}</p>}

        {!selectedType && (
          <div className="rounded-xl border border-[#E4E7EC] bg-white px-4 py-10 text-center text-sm text-[#6B7280]">
            Select a product type above to view or manage its fields.
          </div>
        )}

        {selectedType && fieldsError && (
          <p className="text-sm text-[#B42318]">{fieldsError}</p>
        )}

        {selectedType && fields === null && !fieldsError && (
          <p className="text-sm text-[#6B7280]">Loading fields…</p>
        )}

        {selectedType && fields !== null && (
          <p className="text-xs text-[#9CA3AF] mb-4">
            Only active fields are listed here — deactivating a field removes it from this list.
          </p>
        )}

        {selectedType &&
          fields !== null &&
          SECTIONS.map((section) => {
            const sectionFields = fields
              .filter((f) => f.section === section.value)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            return (
              <div key={section.value} className="mb-5">
                <h2 className="text-sm font-semibold text-[#1B1F27] mb-2">{section.label}</h2>
                <div className="rounded-xl border border-[#E4E7EC] bg-white px-4 py-2">
                  {sectionFields.length === 0 && (
                    <p className="py-4 text-center text-sm text-[#9CA3AF]">No fields yet.</p>
                  )}
                  {sectionFields.map((f) => (
                    <Link
                      key={f._id}
                      href={`/catalog/product-type/field-definition/${f._id}?productType=${encodeURIComponent(selectedType)}`}
                      className="flex items-center justify-between gap-3 py-2.5 border-b border-[#EEF0F3] last:border-b-0 hover:bg-[#F9FAFB] -mx-4 px-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-[#1B1F27] truncate">
                            {f.label}
                          </span>
                          <span className="font-mono text-[11px] text-[#6B7280]">{f.fieldKey}</span>
                          <Badge tone="blue">{f.fieldType}</Badge>
                          {f.isRequired && <Badge tone="green">Required</Badge>}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-[#2F5D9F]">Edit →</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
