"use client";

import { useCallback, useEffect, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

async function fetchSupportedCountries(scope) {
  const res = await fetch(`${BACKEND}/location/countries?scope=${scope}`, {
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || "Failed to load countries");
  }
  return data.countries || [];
}

export function useSupportedCountries({ scope = "supported" } = {}) {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let ignore = false;

    fetchSupportedCountries(scope)
      .then((list) => {
        if (ignore) return;
        setCountries(list);
        setError("");
      })
      .catch((e) => {
        if (ignore) return;
        setError(e.message || "Failed to load countries");
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [scope, reloadIndex]);

  const reload = useCallback(() => {
    setLoading(true);
    setError("");
    setReloadIndex((n) => n + 1);
  }, []);

  return { countries, loading, error, reload };
}
