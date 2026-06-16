"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Trash2, Upload, GripVertical, Image as ImageIcon, Loader2 } from "lucide-react";
import { homepageService } from '../../services/homepageService'
import toast from "react-hot-toast";

const BRAND = "#0C7FD2";

const SECTION_TYPES = [
  { value: "hero", label: "Hero carousel" },
  { value: "category_grid", label: "Card grid (cards / tile boxes)" },
  { value: "department_grid", label: "Department grid (categories)" },
  { value: "featured_collection", label: "Featured collection" },
  { value: "trending", label: "Trending products" },
];

const ACTION_TYPES = [
  { value: "none", label: "Not clickable" },
  { value: "category", label: "Category page" },
  { value: "search", label: "Search results" },
  { value: "collection", label: "Collection" },
  { value: "url", label: "Custom URL" },
];

const input =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0C7FD2] focus:outline-none focus:ring-1 focus:ring-[#0C7FD2]";
const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-700";

function uid() {
  return `tmp_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Image upload field ────────────────────────────────────────────────────────
function ImageField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await homepageService.uploadImage(file);
    setUploading(false);
    if (res.success) onChange(res.url);
    else toast.error(res.error || "Upload failed");
  };
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={20} className="text-gray-300" />
        )}
      </div>
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading ? "Uploading…" : "Upload image"}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </label>
      {value && (
        <button onClick={() => onChange(null)} className="text-xs text-red-500 hover:underline">
          Remove
        </button>
      )}
    </div>
  );
}

// ── Action picker (reused for items + tiles) ─────────────────────────────────
function ActionPicker({ action, onChange }) {
  const set = (patch) => onChange({ ...action, ...patch });
  const setParam = (patch) =>
    onChange({ ...action, actionParams: { ...(action.actionParams || {}), ...patch } });

  return (
    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Click goes to</label>
          <select
            className={input}
            value={action.actionType || "none"}
            onChange={(e) => set({ actionType: e.target.value })}
          >
            {ACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {action.actionType && action.actionType !== "none" && (
          <div>
            <label className={label}>
              {action.actionType === "category"
                ? "Category ID (KCAT…)"
                : action.actionType === "search"
                ? "Search query"
                : action.actionType === "collection"
                ? "Collection slug"
                : "URL / path"}
            </label>
            <input
              className={input}
              value={action.actionValue || ""}
              placeholder={
                action.actionType === "category"
                  ? "KCAT_xxxxx"
                  : action.actionType === "search"
                  ? "e.g. gaming laptop"
                  : action.actionType === "collection"
                  ? "summer-deals"
                  : "/orders or https://…"
              }
              onChange={(e) => set({ actionValue: e.target.value })}
            />
          </div>
        )}
      </div>

      {action.actionType === "search" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Min price (optional)</label>
            <input
              type="number"
              className={input}
              value={action.actionParams?.minPrice ?? ""}
              onChange={(e) =>
                setParam({ minPrice: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className={label}>Max price (optional)</label>
            <input
              type="number"
              className={input}
              placeholder="e.g. 50"
              value={action.actionParams?.maxPrice ?? ""}
              onChange={(e) =>
                setParam({ maxPrice: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tiles editor (the 2x2 box) ───────────────────────────────────────────────
function TilesEditor({ tiles, onChange }) {
  const update = (i, patch) =>
    onChange(tiles.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const add = () =>
    onChange([...tiles, { _key: uid(), title: "", image: null, actionType: "search", actionValue: "" }]);
  const remove = (i) => onChange(tiles.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={label}>Tiles ({tiles.length}/4)</span>
        {tiles.length < 4 && (
          <button
            onClick={add}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#0C7FD2] hover:underline"
          >
            <Plus size={12} /> Add tile
          </button>
        )}
      </div>
      {tiles.map((tile, i) => (
        <div key={tile._key || tile.tileId || i} className="rounded-lg border border-gray-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Tile {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600">
              <Trash2 size={14} />
            </button>
          </div>
          <div className="mb-2">
            <label className={label}>Label</label>
            <input
              className={input}
              value={tile.title}
              placeholder="e.g. Jeans under ₦25,000"
              onChange={(e) => update(i, { title: e.target.value })}
            />
          </div>
          <div className="mb-2">
            <label className={label}>Image</label>
            <ImageField value={tile.image} onChange={(url) => update(i, { image: url })} />
          </div>
          <ActionPicker action={tile} onChange={(a) => update(i, a)} />
        </div>
      ))}
    </div>
  );
}

// ── Item editor ──────────────────────────────────────────────────────────────
function ItemEditor({ item, type, onChange, onRemove }) {
  const set = (patch) => onChange({ ...item, ...patch });
  const usesTiles = type === "category_grid";
  const hasTiles = (item.tiles || []).length > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <GripVertical size={16} />
          <span className="text-sm font-medium text-gray-600">{item.title || "Untitled"}</span>
        </div>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className={label}>Title</label>
          <input
            className={input}
            value={item.title || ""}
            onChange={(e) => set({ title: e.target.value })}
          />
        </div>

        {type === "hero" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>Subtitle</label>
              <input
                className={input}
                value={item.subtitle || ""}
                onChange={(e) => set({ subtitle: e.target.value })}
              />
            </div>
            <div>
              <label className={label}>Button text</label>
              <input
                className={input}
                value={item.caption || ""}
                placeholder="Shop now"
                onChange={(e) => set({ caption: e.target.value })}
              />
            </div>
            <div>
              <label className={label}>Background color</label>
              <input
                type="color"
                className="h-9 w-full cursor-pointer rounded-lg border border-gray-300"
                value={item.backgroundColor || "#e8eef3"}
                onChange={(e) => set({ backgroundColor: e.target.value })}
              />
            </div>
          </div>
        )}

        {(type === "category_grid" || type === "department_grid" || type === "hero") && (
          <div>
            <label className={label}>{type === "hero" ? "Banner image" : "Image"}</label>
            <ImageField value={item.image} onChange={(url) => set({ image: url })} />
          </div>
        )}

        {type === "category_grid" && (
          <div className="rounded-lg bg-gray-50 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={hasTiles}
                onChange={(e) =>
                  set({
                    tiles: e.target.checked
                      ? [{ _key: uid(), title: "", image: null, actionType: "search", actionValue: "" }]
                      : [],
                  })
                }
              />
              Use 2×2 tile box (instead of one big image)
            </label>
            {hasTiles && (
              <>
                <div className="mt-3">
                  <label className={label}>Footer link text</label>
                  <input
                    className={input}
                    value={item.caption || ""}
                    placeholder="See more"
                    onChange={(e) => set({ caption: e.target.value })}
                  />
                </div>
                <div className="mt-3">
                  <TilesEditor tiles={item.tiles || []} onChange={(tiles) => set({ tiles })} />
                </div>
              </>
            )}
          </div>
        )}

        {type === "category_grid" && !hasTiles && (
          <div>
            <label className={label}>Card link text</label>
            <input
              className={input}
              value={item.caption || ""}
              placeholder="Shop now"
              onChange={(e) => set({ caption: e.target.value })}
            />
          </div>
        )}

        {/* item-level action (hidden for category_grid cards in tile mode — tiles carry links) */}
        {!(usesTiles && hasTiles && type === "category_grid") && (
          <ActionPicker action={item} onChange={(a) => set(a)} />
        )}
        {usesTiles && hasTiles && (
          <ActionPicker action={item} onChange={(a) => set(a)} />
        )}
      </div>
    </div>
  );
}

// ── Main editor ──────────────────────────────────────────────────────────────
export default function SectionEditor({ section, onClose, onSaved }) {
  const isNew = !section?.sectionId;
  const [type, setType] = useState(section?.type || "hero");
  const [title, setTitle] = useState(section?.title || "");
  const [subtitle, setSubtitle] = useState(section?.subtitle || "");
  const [settings, setSettings] = useState(section?.settings || {});
  const [items, setItems] = useState(
    (section?.items || []).map((it) => ({ ...it, _key: it.itemId || uid() }))
  );
  const [saving, setSaving] = useState(false);

  const setSetting = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const addItem = () =>
    setItems((arr) => [
      ...arr,
      { _key: uid(), title: "", image: null, actionType: "none", actionValue: "", tiles: [] },
    ]);
  const updateItem = (i, next) => setItems((arr) => arr.map((it, idx) => (idx === i ? next : it)));
  const removeItem = (i) => setItems((arr) => arr.filter((_, idx) => idx !== i));

  const isAutoDept = type === "department_grid" && settings.source === "auto_top_categories";
  const usesItems = ["hero", "category_grid"].includes(type) || (type === "department_grid" && !isAutoDept);

  const save = async () => {
    setSaving(true);
    const cleanItems = items.map(({ _key, ...rest }) => ({
      ...rest,
      tiles: (rest.tiles || []).map(({ _key: k, ...t }) => t),
    }));
    const payload = { type, title, subtitle, settings, items: usesItems ? cleanItems : [] };
    const res = isNew
      ? await homepageService.createSection(payload)
      : await homepageService.updateSection(section.sectionId, payload);
    setSaving(false);
    if (res.success) {
      toast.success(isNew ? "Section created" : "Section saved");
      onSaved?.(res.section);
    } else {
      toast.error(res.error || "Save failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/50" onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col bg-gray-50 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold">{isNew ? "New section" : "Edit section"}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className={label}>Section type</label>
            <select className={input} value={type} onChange={(e) => setType(e.target.value)}>
              {SECTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>Heading (optional)</label>
              <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className={label}>Subheading (optional)</label>
              <input
                className={input}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
          </div>

          {/* Type-specific settings */}
          {type === "hero" && (
            <div>
              <label className={label}>Autoplay (ms)</label>
              <input
                type="number"
                className={input}
                value={settings.autoplayMs ?? 5000}
                onChange={(e) => setSetting({ autoplayMs: Number(e.target.value) })}
              />
            </div>
          )}

          {type === "department_grid" && (
            <div className="space-y-2 rounded-lg bg-white p-3">
              <label className={label}>Source</label>
              <select
                className={input}
                value={settings.source || "manual"}
                onChange={(e) => setSetting({ source: e.target.value })}
              >
                <option value="manual">Manual (I pick the categories)</option>
                <option value="auto_top_categories">Auto — top sellable categories</option>
              </select>
              {isAutoDept && (
                <div className="space-y-2">
                  <div>
                    <label className={label}>How many</label>
                    <input
                      type="number"
                      className={input}
                      value={settings.limit ?? 10}
                      onChange={(e) => setSetting({ limit: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className={label}>Rank by</label>
                    <select
                      className={input}
                      value={settings.metric || "offers"}
                      onChange={(e) => setSetting({ metric: e.target.value })}
                    >
                      <option value="offers">Most sellable (live offers)</option>
                      <option value="sales">Best selling (orders)</option>
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Filled automatically from your catalog. No manual items needed.
                  </p>
                </div>
              )}
            </div>
          )}

          {(type === "featured_collection" || type === "trending") && (
            <div className="space-y-2 rounded-lg bg-white p-3">
              {type === "featured_collection" && (
                <div>
                  <label className={label}>Collection slug (optional)</label>
                  <input
                    className={input}
                    value={settings.collectionSlug || ""}
                    placeholder="summer-deals"
                    onChange={(e) => setSetting({ collectionSlug: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className={label}>Search query</label>
                <input
                  className={input}
                  value={settings.query || ""}
                  placeholder={type === "trending" ? "leave blank for newest" : "e.g. headphones"}
                  onChange={(e) => setSetting({ query: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={label}>Max items</label>
                  <input
                    type="number"
                    className={input}
                    value={settings.maxItems ?? 12}
                    onChange={(e) => setSetting({ maxItems: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className={label}>Sort</label>
                  <select
                    className={input}
                    value={settings.sortBy || "products"}
                    onChange={(e) => setSetting({ sortBy: e.target.value })}
                  >
                    <option value="products">Best match</option>
                    <option value="products_newest_desc">Newest</option>
                    <option value="products_price_asc">Price low→high</option>
                    <option value="products_price_desc">Price high→low</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          {usesItems && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">
                  {type === "hero" ? "Banners" : type === "department_grid" ? "Categories" : "Cards"}
                </span>
                <button
                  onClick={addItem}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              {items.map((item, i) => (
                <ItemEditor
                  key={item._key}
                  item={item}
                  type={type}
                  onChange={(next) => updateItem(i, { ...next, _key: item._key })}
                  onRemove={() => removeItem(i)}
                />
              ))}
              {items.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-600">
                  No items yet. Add one to get started.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: BRAND }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isNew ? "Create section" : "Save changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}