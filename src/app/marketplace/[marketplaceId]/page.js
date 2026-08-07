"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Lock } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function MarketplaceById() {
  const { marketplaceId } = useParams();
  const [marketplace, setMarketplace] = useState(null);
  const [regions, setRegions] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        const [mRes, rRes] = await Promise.all([
          fetch(`${BACKEND}/admin/marketplaces/${marketplaceId}`, {
            credentials: "include",
          }),
          fetch(`${BACKEND}/admin/regions`, { credentials: "include" }),
        ]);
        const mData = await mRes.json();
        const rData = await rRes.json();
        if (!mRes.ok || !mData.success)
          throw new Error(mData.message || "Failed to load");

        if (!ignore) {
          const m = mData.marketplace;
          setMarketplace(m);
          setRegions(rData.success ? rData.regions || [] : []);
          setForm({
            name: m.name || "",
            code: m.code || "",
            regionId: m.regionId?.regionId || "",
            domains: (m.domains || []).join(", "),
            sellerSubscriptionAmount: m.sellerSubscriptionAmount ?? "",
            sellerSubscriptionPromoAmount:
              m.sellerSubscriptionPromoAmount ?? "",
            individualPerItemfee: m.individualPerItemfee ?? "",
            taxRate: m.settings?.taxRate ?? "",
            taxName: m.settings?.taxName || "",
            // Locked after creation — display only, never sent on save.
            country: m.country || "",
            countryCode: m.countryCode || "",
            timezone: m.timezone || "",
            language: m.language || "en",
            currencyCode: m.currency?.code || "",
            currencySymbol: m.currency?.symbol || "",
            currencyName: m.currency?.name || "",
            nodeSegment: m.nodeSegment ?? "",
          });
        }
      } catch (e) {
        if (!ignore) setError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [marketplaceId, reloadKey]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      // country, countryCode, timezone, language, currency and nodeSegment
      // are locked (see the read-only fields below) and intentionally left
      // out of this payload so they can never change after creation.
      const body = {
        name: form.name.trim(),
        code: form.code.trim(),
        regionId: form.regionId || undefined,
        domains: form.domains
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        sellerSubscriptionAmount: form.sellerSubscriptionAmount,
        sellerSubscriptionPromoAmount: form.sellerSubscriptionPromoAmount,
        individualPerItemfee: form.individualPerItemfee,
        settings: {
          taxRate: form.taxRate !== "" ? Number(form.taxRate) : undefined,
          taxName: form.taxName.trim() || undefined,
        },
      };

      const res = await fetch(
        `${BACKEND}/admin/marketplaces/${marketplaceId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to save");
      setMarketplace((prev) => ({ ...prev, ...data.marketplace }));
      setSuccess("Saved");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    setToggling(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `${BACKEND}/admin/marketplaces/${marketplaceId}/toggle-active`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to update");
      setMarketplace((prev) => ({
        ...prev,
        isActive: data.marketplace.isActive,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }
  if (!marketplace || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-red-600">
        {error || "Marketplace not found"}
      </div>
    );
  }

  const input =
    "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900";
  const inputLocked =
    "w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed";
  const label = "block text-sm font-medium text-gray-700 mb-1";
  const lockedLabel =
    "flex items-center gap-1 text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href="/marketplace"
          className="flex items-center gap-1 text-sm text-gray-600 hover:underline mb-4"
        >
          <ArrowLeft size={15} /> Back to marketplaces
        </Link>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {marketplace.name}
          </h1>
          <button
            onClick={toggleActive}
            disabled={toggling}
            className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
              marketplace.isActive
                ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {toggling
              ? "Updating…"
              : marketplace.isActive
                ? "Deactivate"
                : "Activate"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-6">
          {marketplace.marketplaceId}
        </p>

        <form
          onSubmit={save}
          className="bg-white border border-gray-200 rounded-xl p-6 space-y-5"
        >
          <div>
            <label className={label}>Region</label>
            <select
              value={form.regionId}
              onChange={set("regionId")}
              className={`${input} bg-white`}
            >
              <option value="">Select a region</option>
              {regions.map((r) => (
                <option key={r.regionId} value={r.regionId}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Name</label>
              <input
                value={form.name}
                onChange={set("name")}
                required
                className={input}
              />
            </div>
            <div>
              <label className={label}>Code</label>
              <input
                value={form.code}
                onChange={set("code")}
                required
                maxLength={5}
                className={input}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lockedLabel}>
                <Lock size={12} /> Country
              </label>
              <input
                value={form.country}
                readOnly
                disabled
                className={inputLocked}
              />
            </div>
            <div>
              <label className={lockedLabel}>
                <Lock size={12} /> Country code
              </label>
              <input
                value={form.countryCode}
                readOnly
                disabled
                className={inputLocked}
              />
            </div>
            <div>
              <label className={lockedLabel}>
                <Lock size={12} /> Timezone
              </label>
              <input
                value={form.timezone}
                readOnly
                disabled
                className={inputLocked}
              />
            </div>
            <div>
              <label className={lockedLabel}>
                <Lock size={12} /> Language
              </label>
              <input
                value={form.language}
                readOnly
                disabled
                className={inputLocked}
              />
            </div>
          </div>

          <div>
            <label className={label}>Domains (comma-separated)</label>
            <input
              value={form.domains}
              onChange={set("domains")}
              required
              className={input}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lockedLabel}>
                <Lock size={12} /> Currency code
              </label>
              <input
                value={form.currencyCode}
                readOnly
                disabled
                className={inputLocked}
              />
            </div>
            <div>
              <label className={lockedLabel}>
                <Lock size={12} /> Symbol
              </label>
              <input
                value={form.currencySymbol}
                readOnly
                disabled
                className={inputLocked}
              />
            </div>
            <div>
              <label className={lockedLabel}>
                <Lock size={12} /> Currency name
              </label>
              <input
                value={form.currencyName}
                readOnly
                disabled
                className={inputLocked}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={label}>Pro subscription /mo</label>
              <input
                type="number"
                step="0.01"
                value={form.sellerSubscriptionAmount}
                onChange={set("sellerSubscriptionAmount")}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Promo amount</label>
              <input
                type="number"
                step="0.01"
                value={form.sellerSubscriptionPromoAmount}
                onChange={set("sellerSubscriptionPromoAmount")}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Individual per-item fee</label>
              <input
                type="number"
                step="0.01"
                value={form.individualPerItemfee}
                onChange={set("individualPerItemfee")}
                className={input}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Tax rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={form.taxRate}
                onChange={set("taxRate")}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Tax name</label>
              <input
                value={form.taxName}
                onChange={set("taxName")}
                className={input}
              />
            </div>
          </div>

          <div>
            <label className={lockedLabel}>
              <Lock size={12} /> Node segment
            </label>
            <input
              value={form.nodeSegment}
              readOnly
              disabled
              className={inputLocked}
            />
            <p className="text-xs text-gray-500 mt-1">
              Permanent — set once at creation and never changes.
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
