const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let body = null;
  try {
    body = await res.json();
  } catch {}

  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }

  return body;
}

export const fetchEligibleConditions = async () => {
  const body = await request("/products/conditions");
  return body.conditions || [];
};

export const fetchProductCategories = async ({
  includeInactive = false,
} = {}) => {
  const body = await request(
    `/product-categories?includeInactive=${includeInactive}`,
  );
  return body.data || [];
};

export const createProductCategory = async (payload) => {
  const body = await request("/product-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return body.data;
};

export const bulkCreateProductCategories = async (categories) => {
  const body = await request("/product-categories/bulk", {
    method: "POST",
    body: JSON.stringify({ categories }),
  });
  return body.data;
};

export const updateProductCategory = async (code, payload) => {
  const body = await request(
    `/product-categories/${encodeURIComponent(code)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
  return body.data;
};
