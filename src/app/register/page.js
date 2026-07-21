'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Image from 'next/image';
import { KeyRound } from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const LOGO = 'https://res.cloudinary.com/khalifrex/image/upload/v1762704364/logo_ufb5hc.png';

export default function AdminRegister() {
  const [form, setForm] = useState({
    registrationKey: '', firstName: '', lastName: '', email: '', password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const input = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${BACKEND}/admin/register-admin`, form, { withCredentials: true });
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center mb-6">
          <Image src={LOGO} alt="Khalifrex" width={140} height={40} className="object-contain" priority />
        </div>
        <h1 className="text-xl font-semibold mb-6 text-center text-gray-900">Admin registration</h1>
        {error && <p className="text-red-600 mb-4 text-sm text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="First name" value={form.firstName} onChange={set('firstName')} required className={input} />
            <input placeholder="Last name" value={form.lastName} onChange={set('lastName')} required className={input} />
          </div>
          <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required className={input} />
          <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required className={input} />
          <div className="border-t border-gray-100 pt-4">
            <label className="text-sm font-medium text-gray-700 mb-1 inline-flex items-center gap-1.5">
              <KeyRound size={14} /> Registration key
            </label>
            <input type="password" placeholder="Admin registration key" value={form.registrationKey}
              onChange={set('registrationKey')} required className={input} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {loading ? 'Registering…' : 'Register admin'}
          </button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-gray-900 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}