"use client";

import { useRef, useState } from "react";
import { uploadBrowseNodeImage } from "@/app/api/browseNodeApi";
import Image from "next/image";
const input =
  "w-full rounded-md border border-[#D0D5DD] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D9F]/40 focus:border-[#2F5D9F]";

export default function ImageUploadField({
  value,
  onChange,
  disabled = false,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadBrowseNodeImage(file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <Image
          src={value}
          alt="Browse node"
          width={80}
          height={80}
          className="h-20 w-20 object-contain rounded-md border border-[#D0D5DD]"
        />
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value || ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL, or upload a file →"
          className={`${input} flex-1 disabled:bg-[#F5F6F8] disabled:text-[#6B7280]`}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled || uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
          id="browse-node-image-upload"
        />
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-md border border-[#D0D5DD] px-3 py-2 text-xs font-semibold text-[#374151] hover:border-[#2F5D9F] hover:text-[#2F5D9F] disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 rounded-md border border-[#D0D5DD] px-2 py-2 text-xs text-[#B42318] hover:bg-[#FEF3F2]"
          >
            ×
          </button>
        )}
      </div>
      {error && <p className="text-[#B42318] text-xs">{error}</p>}
    </div>
  );
}
