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

export const fetchProductTypes = async ({ search, includeInactive = false } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (includeInactive) params.set("includeInactive", "true");
  const body = await request(`/product-types?${params.toString()}`);
  return body.data || [];
};

export const fetchProductType = async (name) => {
  const body = await request(`/product-types/${encodeURIComponent(name)}`);
  return body.data;
};

export const fetchProductTypeFields = async (name, { section, parentageLevel } = {}) => {
  const params = new URLSearchParams();
  if (section) params.set("section", section);
  if (parentageLevel) params.set("parentageLevel", parentageLevel);
  const body = await request(
    `/product-types/${encodeURIComponent(name)}/fields?${params.toString()}`,
  );
  return body.data;
};

export const createProductType = async (payload) => {
  const body = await request("/product-types", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return body.data;
};

export const updateProductType = async (name, payload) => {
  const body = await request(`/product-types/${encodeURIComponent(name)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return body.data;
};

export const deleteProductType = async (name) => {
  return request(`/product-types/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
};
