"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchBrowseNodeRoots, fetchBrowseNodeChildren } from "@/app/api/browseNodeApi";

function TreeNode({ node, depth, selected, onToggle, excludeNodeId, nodeCache }) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState(null);
  const [loading, setLoading] = useState(false);

  const isSelectable = node.browseNodeId !== excludeNodeId;
  const isSelected = selected.includes(node.browseNodeId);

  const toggleExpand = async () => {
    if (!node.hasChildren) return;
    if (!expanded && children === null) {
      setLoading(true);
      try {
        const kids = await fetchBrowseNodeChildren(node.browseNodeId);
        kids.forEach((k) => nodeCache.set(k.browseNodeId, k));
        setChildren(kids);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((v) => !v);
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1"
        style={{ paddingLeft: `${depth * 18}px` }}
      >
        <button
          type="button"
          onClick={toggleExpand}
          className={`h-5 w-5 shrink-0 flex items-center justify-center text-[10px] text-[#6B7280] ${
            node.hasChildren ? "cursor-pointer" : "opacity-0 cursor-default"
          }`}
        >
          {loading ? "…" : expanded ? "▾" : "▸"}
        </button>
        <label
          className={`flex items-center gap-2 text-sm ${
            isSelectable ? "text-[#1B1F27] cursor-pointer" : "text-[#D0D5DD] cursor-not-allowed"
          }`}
        >
          <input
            type="checkbox"
            disabled={!isSelectable}
            checked={isSelected}
            onChange={() => onToggle(node.browseNodeId)}
            className="rounded border-[#D0D5DD]"
          />
          {node.name}
          {node.isSellable && (
            <span className="text-[10px] text-[#9CA3AF]">(sellable leaf)</span>
          )}
        </label>
      </div>
      {expanded &&
        children?.map((c) => (
          <TreeNode
            key={c.browseNodeId}
            node={c}
            depth={depth + 1}
            selected={selected}
            onToggle={onToggle}
            excludeNodeId={excludeNodeId}
            nodeCache={nodeCache}
          />
        ))}
    </div>
  );
}

export default function BrowseNodeParentPicker({
  selected,
  onChange,
  excludeNodeId = null,
  nodeCache,
}) {
  const [roots, setRoots] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBrowseNodeRoots()
      .then((r) => {
        r.forEach((n) => nodeCache.set(n.browseNodeId, n));
        setRoots(r);
      })
      .catch((err) => setError(err.message));
  }, [nodeCache]);

  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selected.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FB] border border-[#D0D9EE] text-[#2F5D9F] px-3 py-1 text-xs font-medium"
          >
            {nodeCache.get(id)?.name || id}
            <button
              type="button"
              onClick={() => toggle(id)}
              className="text-[#2F5D9F]/60 hover:text-[#B42318]"
            >
              ×
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-xs text-[#9CA3AF] italic">
            No parents selected — this will be a top-level (root) browse node.
          </span>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto rounded-md border border-[#D0D5DD] p-2">
        {error && <p className="text-xs text-[#B42318]">{error}</p>}
        {!error && roots === null && <p className="text-xs text-[#6B7280]">Loading tree…</p>}
        {!error && roots?.length === 0 && (
          <p className="text-xs text-[#9CA3AF] italic">No browse nodes yet.</p>
        )}
        {roots?.map((n) => (
          <TreeNode
            key={n.browseNodeId}
            node={n}
            depth={0}
            selected={selected}
            onToggle={toggle}
            excludeNodeId={excludeNodeId}
            nodeCache={nodeCache}
          />
        ))}
      </div>
    </div>
  );
}
