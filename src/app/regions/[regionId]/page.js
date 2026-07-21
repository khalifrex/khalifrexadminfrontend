'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function RegionById() {
  const { regionId } = useParams();
  const [region, setRegion] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND}/admin/regions/${regionId}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
        if (!ignore) {
          setRegion(data.region);
          setForm({ name: data.region.name, code: data.region.code });
        }
      } catch (e) {
        if (!ignore) setError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [regionId, reloadKey]);

  const save = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const res = await fetch(`${BACKEND}/admin/regions/${regionId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save');
      setRegion(data.region);
      setSuccess('Saved');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    setToggling(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${BACKEND}/admin/regions/${regionId}/toggle-active`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update');
      setRegion(data.region);
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
  if (!region) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-red-600">
        {error || 'Region not found'}
      </div>
    );
  }

  const input = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900";
  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-6 py-10">
        <Link href="/region" className="flex items-center gap-1 text-sm text-gray-600 hover:underline mb-4">
          <ArrowLeft size={15} /> Back to regions
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{region.name}</h1>
          <button onClick={toggleActive} disabled={toggling}
            className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
              region.isActive
                ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}>
            {toggling ? 'Updating…' : region.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>

        <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <p className="text-xs text-gray-500">Region ID: {region.regionId}</p>
          <div>
            <label className={label}>Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className={input} />
          </div>
          <div>
            <label className={label}>Code</label>
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required maxLength={5} className={input} />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button type="submit" disabled={saving}
            className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>) : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}