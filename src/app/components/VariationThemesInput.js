"use client";

import TagListInput from "./TagListInput";

export default function VariationThemesInput({ themes = [], onChange, disabled = false }) {
  const updateGroup = (idx, group) =>
    onChange(themes.map((g, i) => (i === idx ? group : g)));
  const addGroup = () => onChange([...themes, []]);
  const removeGroup = (idx) => onChange(themes.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#6B7280]">
        Each group is a set of attributes that together define a variation (e.g. "color" +
        "size" for combined variations). Most product types use a single theme per group.
      </p>
      {themes.map((group, idx) => (
        <div key={idx} className="flex items-start gap-2 rounded-md border border-[#EEF0F3] p-3">
          <div className="flex-1">
            <TagListInput
              values={group}
              onChange={(v) => updateGroup(idx, v)}
              placeholder="e.g. color"
              disabled={disabled}
            />
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeGroup(idx)}
              title="Remove theme group"
              className="h-8 w-8 shrink-0 rounded-md border border-[#D0D5DD] text-[#B42318] text-sm font-semibold hover:bg-[#FEF3F2]"
            >
              ×
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={addGroup}
          className="text-xs font-semibold text-[#2F5D9F] hover:text-[#1F3F73]"
        >
          + Add theme group
        </button>
      )}
      {!themes.length && (
        <p className="text-xs text-[#9CA3AF] italic">No variation themes configured.</p>
      )}
    </div>
  );
}
