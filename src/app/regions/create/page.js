'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, KeyRound } from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function CreateRegionPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', code: '', creationCode: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const input = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900";
  const label = "block text-sm font-medium text-gray-700 mb-1";

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND}/admin/regions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create region');
      router.push('/regions');
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-6 py-10">
        <Link href="/regions" className="flex items-center gap-1 text-sm text-gray-600 hover:underline mb-4">
          <ArrowLeft size={15} /> Back to regions
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create region</h1>

        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <label className={label}>Name</label>
            <input value={form.name} onChange={set('name')} placeholder="Africa" required className={input} />
          </div>
          <div>
            <label className={label}>Code</label>
            <input value={form.code} onChange={set('code')} placeholder="AF" required maxLength={5} className={input} />
          </div>
          <div className="border-t border-gray-100 pt-5">
            <label className={label}>
              <span className="inline-flex items-center gap-1.5"><KeyRound size={14} /> Creation code</span>
            </label>
            <input type="password" value={form.creationCode} onChange={set('creationCode')} required
              placeholder="Enter the secret creation code" className={input} />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>) : 'Create region'}
          </button>
        </form>
      </div>
    </div>
  );
}