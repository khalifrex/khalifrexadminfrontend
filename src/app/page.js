'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Store, Users, ShieldCheck, LayoutGrid, Globe, House } from 'lucide-react';

const LOGO = 'https://res.cloudinary.com/khalifrex/image/upload/v1762704364/logo_ufb5hc.png';

const SECTIONS = [
  { href: '/regions', label: 'Regions', desc: 'Create and manage regions', icon: Globe },
  { href: '/marketplace', label: 'Marketplaces', desc: 'Create and manage marketplaces', icon: Store },
  { href: '/homepagemanager', label: 'Homepages', desc: 'Create and manage homepages', icon:House },
  { href: '/users', label: 'Users', desc: 'Manage buyer accounts', icon: Users },
  { href: '/sellers/review', label: 'Seller review', desc: 'KYC and verification queue', icon: ShieldCheck },
  { href: '/categories', label: 'Categories', desc: 'Manage product categories', icon: LayoutGrid },
];

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Image src={LOGO} alt="Khalifrex" width={50} height={50} className="object-contain" />
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Admin</span>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-colors flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{s.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}