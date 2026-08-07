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
    const err = new Error(body?.message || `Request failed (${res.status})`);
    err.details = body?.errors;
    throw err;
  }

  return body;
}

export const createProductTypeField = async (payload) => {
  const body = await request("/product-types/fields", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return body.data.field;
};

export const updateProductTypeField = async (fieldId, payload) => {
  const body = await request(`/product-types/fields/${encodeURIComponent(fieldId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return body.data.field;
};

export const deleteProductTypeField = async (fieldId) => {
  return request(`/product-types/fields/${encodeURIComponent(fieldId)}`, {
    method: "DELETE",
  });
};
