"use client";

import { useState } from "react";

export default function TagListInput({
  values = [],
  onChange,
  placeholder = "Type and press Enter",
  disabled = false,
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setDraft("");
  };

  const remove = (idx) => onChange(values.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v, idx) => (
          <span
            key={`${v}-${idx}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FB] border border-[#D0D9EE] text-[#2F5D9F] px-3 py-1 text-xs font-medium"
          >
            {v}
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-[#2F5D9F]/60 hover:text-[#B42318]"
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          className="w-full rounded-md border border-[#D0D5DD] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]"
        />
      )}
    </div>
  );
}
