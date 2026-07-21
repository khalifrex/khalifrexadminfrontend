'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const empty = {
  name: '', code: '', country: '', timezone: '', regionId: '',
  currencyCode: '', currencySymbol: '', currencyName: '',
  domains: '', language: 'en',
  sellerSubscriptionAmount: '', sellerSubscriptionPromoAmount: '', individualPeritemfee: '',
  taxRate: '', taxName: '', creationCode: '',
};

export default function CreateMarketplacePage() {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [regions, setRegions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/admin/regions`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setRegions((data.regions || []).filter((r) => r.isActive));
      } catch {}
    })();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const input = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900";
  const label = "block text-sm font-medium text-gray-700 mb-1";

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        code: form.code.trim(),
        country: form.country.trim(),
        timezone: form.timezone.trim(),
        regionId: form.regionId,
        language: form.language.trim() || 'en',
        domains: form.domains.split(',').map((d) => d.trim()).filter(Boolean),
        currency: {
          code: form.currencyCode.trim(),
          symbol: form.currencySymbol.trim(),
          name: form.currencyName.trim() || undefined,
        },
        sellerSubscriptionAmount: form.sellerSubscriptionAmount !== '' ? Number(form.sellerSubscriptionAmount) : undefined,
        sellerSubscriptionPromoAmount: form.sellerSubscriptionPromoAmount !== '' ? Number(form.sellerSubscriptionPromoAmount) : null,
        individualPeritemfee: form.individualPeritemfee !== '' ? Number(form.individualPeritemfee) : null,
        settings: {
          taxRate: form.taxRate !== '' ? Number(form.taxRate) : undefined,
          taxName: form.taxName.trim() || undefined,
        },
        creationCode: form.creationCode,
      };

      const res = await fetch(`${BACKEND}/admin/marketplaces`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create marketplace');
      router.push(`/marketplace/${data.marketplace.marketplaceId}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/marketplace" className="flex items-center gap-1 text-sm text-gray-600 hover:underline mb-4">
          <ArrowLeft size={15} /> Back to marketplaces
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create marketplace</h1>

        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <label className={label}>Region</label>
            <select value={form.regionId} onChange={set('regionId')} required className={`${input} bg-white`}>
              <option value="">Select a region</option>
              {regions.map((r) => (
                <option key={r.regionId} value={r.regionId}>{r.name} ({r.code})</option>
              ))}
            </select>
            {regions.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No active regions found. <Link href="/region/create" className="underline">Create one first</Link>.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Name</label>
              <input value={form.name} onChange={set('name')} placeholder="Khalifrex Nigeria" required className={input} />
            </div>
            <div>
              <label className={label}>Code</label>
              <input value={form.code} onChange={set('code')} placeholder="NG" required maxLength={5} className={input} />
            </div>
            <div>
              <label className={label}>Country</label>
              <input value={form.country} onChange={set('country')} placeholder="Nigeria" required className={input} />
            </div>
            <div>
              <label className={label}>Timezone</label>
              <input value={form.timezone} onChange={set('timezone')} placeholder="Africa/Lagos" required className={input} />
            </div>
          </div>

          <div>
            <label className={label}>Domains (comma-separated)</label>
            <input value={form.domains} onChange={set('domains')} placeholder="khalifrex.com, sell.khalifrex.com, admin.khalifrex.com" required className={input} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={label}>Currency code</label>
              <input value={form.currencyCode} onChange={set('currencyCode')} placeholder="NGN" required maxLength={3} className={input} />
            </div>
            <div>
              <label className={label}>Symbol</label>
              <input value={form.currencySymbol} onChange={set('currencySymbol')} placeholder="₦" required className={input} />
            </div>
            <div>
              <label className={label}>Currency name</label>
              <input value={form.currencyName} onChange={set('currencyName')} placeholder="Nigerian Naira" className={input} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={label}>Pro subscription /mo</label>
              <input type="number" step="0.01" value={form.sellerSubscriptionAmount} onChange={set('sellerSubscriptionAmount')} className={input} />
            </div>
            <div>
              <label className={label}>Promo amount</label>
              <input type="number" step="0.01" value={form.sellerSubscriptionPromoAmount} onChange={set('sellerSubscriptionPromoAmount')} className={input} />
            </div>
            <div>
              <label className={label}>Individual per-item fee</label>
              <input type="number" step="0.01" value={form.individualPeritemfee} onChange={set('individualPeritemfee')} className={input} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Tax rate (%)</label>
              <input type="number" step="0.01" value={form.taxRate} onChange={set('taxRate')} className={input} />
            </div>
            <div>
              <label className={label}>Tax name</label>
              <input value={form.taxName} onChange={set('taxName')} placeholder="VAT" className={input} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <label className={label}>
              <span className="inline-flex items-center gap-1.5"><KeyRound size={14} /> Marketplace creation code</span>
            </label>
            <input type="password" value={form.creationCode} onChange={set('creationCode')} required
              placeholder="Enter the secret creation code" className={input} />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={submitting || regions.length === 0}
            className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>) : 'Create marketplace'}
          </button>
        </form>
      </div>
    </div>
  );
}