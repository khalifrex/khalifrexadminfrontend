"use client";

import { useEffect, useState } from "react";
import { Reorder, AnimatePresence, useDragControls } from "framer-motion";
import {
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff,
  Layout, Loader2, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { homepageService } from '../services/homepageService';
import SectionEditor from "./component/SectionEditor";

const BRAND = "#0C7FD2";
const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || "/";

const TYPE_LABELS = {
  hero: "Hero carousel",
  category_grid: "Card grid",
  department_grid: "Department grid",
  featured_collection: "Featured collection",
  trending: "Trending",
};

function SectionRow({ section, onEdit, onDelete, onToggle }) {
  const controls = useDragControls();
  const itemCount = (section.items || []).length;
  const auto =
    section.type === "department_grid" &&
    section.settings?.source === "auto_top_categories";

  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">
            {section.title || TYPE_LABELS[section.type]}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
            {TYPE_LABELS[section.type] || section.type}
          </span>
          {!section.isActive && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Hidden
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-400">
          {auto
            ? `Auto · top ${section.settings?.limit || 10} categories`
            : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
        </p>
      </div>

      <button
        onClick={() => onToggle(section)}
        title={section.isActive ? "Hide" : "Show"}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
      >
        {section.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      <button onClick={() => onEdit(section)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
        <Pencil size={16} />
      </button>
      <button
        onClick={() => onDelete(section)}
        className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={16} />
      </button>
    </Reorder.Item>
  );
}

export default function HomepageManager() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(undefined);
  const [savingOrder, setSavingOrder] = useState(false);
  useEffect(() => {
    let cancelled = false;

    const fetchSections = async () => {
      setLoading(true);
      const res = await homepageService.getAdminHomepage();
      if (cancelled) return;
      if (res.success) setSections(res.sections || []);
      else toast.error(res.error || "Failed to load");
      setLoading(false);
    };

    fetchSections();
    return () => { cancelled = true; };
  }, []);
  const load = async () => {
    setLoading(true);
    const res = await homepageService.getAdminHomepage();
    if (res.success) setSections(res.sections || []);
    else toast.error(res.error || "Failed to load");
    setLoading(false);
  };

  const persistOrder = async (next) => {
    setSavingOrder(true);
    const res = await homepageService.reorderSections(next.map((s) => s.sectionId));
    setSavingOrder(false);
    if (!res.success) {
      toast.error("Reorder failed");
      load();
    }
  };

  const handleReorder = (next) => setSections(next);

  const handleToggle = async (section) => {
    const res = await homepageService.updateSection(section.sectionId, {
      isActive: !section.isActive,
    });
    if (res.success) {
      setSections((arr) =>
        arr.map((s) => (s.sectionId === section.sectionId ? res.section : s))
      );
    } else toast.error("Update failed");
  };

  const handleDelete = async (section) => {
    if (!confirm(`Delete "${section.title || TYPE_LABELS[section.type]}"? This can't be undone.`))
      return;
    const res = await homepageService.deleteSection(section.sectionId);
    if (res.success)
      setSections((arr) => arr.filter((s) => s.sectionId !== section.sectionId));
    else toast.error("Delete failed");
  };

  const handleSaved = (saved) => {
    setSections((arr) => {
      const exists = arr.some((s) => s.sectionId === saved.sectionId);
      return exists
        ? arr.map((s) => (s.sectionId === saved.sectionId ? saved : s))
        : [...arr, saved];
    });
    setEditing(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout size={22} style={{ color: BRAND }} />
            <h1 className="text-xl font-bold text-gray-900">Homepage</h1>
            {savingOrder && <Loader2 size={16} className="animate-spin text-gray-400" />}
          </div>
          <div className="flex gap-2">
            <a
              href={STOREFRONT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <ExternalLink size={15} /> View live
            </a>
            <button
              onClick={() => setEditing(null)}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: BRAND }}
            >
              <Plus size={16} /> Add section
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-white shadow-sm" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <p className="mb-1 font-medium text-gray-900">No sections yet</p>
            <p className="mb-4 text-sm text-gray-500">
              Add a hero carousel, card grid, or department row to start.
            </p>
            <button
              onClick={() => setEditing(null)}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: BRAND }}
            >
              <Plus size={16} /> Add your first section
            </button>
          </div>
        ) : (
          <Reorder.Group axis="y" values={sections} onReorder={handleReorder} className="space-y-3">
            {sections.map((section) => (
              <SectionRow
                key={section.sectionId}
                section={section}
                onEdit={setEditing}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </Reorder.Group>
        )}

        {sections.length > 1 && (
          <p className="mt-3 text-center text-xs text-gray-400">
            Drag the handle to reorder. Order saves automatically.
          </p>
        )}
      </div>

      <AnimatePresence>
        {editing !== undefined && (
          <SectionEditor
            section={editing}
            onClose={() => setEditing(undefined)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <OrderAutosave sections={sections} onSave={persistOrder} loading={loading} />
    </div>
  );
}
function OrderAutosave({ sections, onSave, loading }) {
  useEffect(() => {
    if (loading || sections.length === 0) return;
    const t = setTimeout(() => onSave(sections), 600);
    return () => clearTimeout(t);
  }, [sections.map((s) => s.sectionId).join("|")]);
  return null;
}