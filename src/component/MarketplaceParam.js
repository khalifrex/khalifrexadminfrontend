'use client';
import { useEffect } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const MID = process.env.NEXT_PUBLIC_MARKETPLACE_ID;

function withParam(url) {
  const u = new URL(url, API);
  if (!u.searchParams.has('marketplaceId')) u.searchParams.set('marketplaceId', MID);
  return u.toString();
}

export default function MarketplaceParam() {
  useEffect(() => {
    if (!API || !MID) return;

    const origFetch = window.fetch;
    window.fetch = (input, init) => {
      try {
        const raw = typeof input === 'string' ? input : input?.url;
        if (raw && raw.startsWith(API)) {
          return origFetch(withParam(raw), init);
        }
      } catch {}
      return origFetch(input, init);
    };

    const interceptorId = axios.interceptors.request.use((config) => {
      const raw = config.url || '';
      const full = raw.startsWith('http') ? raw : `${config.baseURL || ''}${raw}`;
      if (full.startsWith(API)) {
        config.params = { ...config.params, marketplaceId: MID };
      }
      return config;
    });

    return () => {
      window.fetch = origFetch;
      axios.interceptors.request.eject(interceptorId);
    };
  }, []);

  return null;
}