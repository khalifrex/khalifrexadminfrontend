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

export const fetchBrandRegistrationCounts = async () => {
  const body = await request(`/admin/brand-registrations/counts`);
  return body.data;
};

export const fetchBrandRegistrations = async ({ status = "pending", page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") params.set("status", status);
  const body = await request(`/admin/brand-registrations?${params.toString()}`);
  return body;
};

export const fetchBrandRegistrationDetail = async (id) => {
  const body = await request(`/admin/brand-registrations/${encodeURIComponent(id)}`);
  return body.data;
};

export const approveBrandRegistration = async (id) => {
  const body = await request(`/admin/brand-registrations/${encodeURIComponent(id)}/approve`, {
    method: "PATCH",
  });
  return body.data;
};

export const rejectBrandRegistration = async (id, rejectionReason) => {
  const body = await request(`/admin/brand-registrations/${encodeURIComponent(id)}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ rejectionReason }),
  });
  return body.data;
};

export const suspendBrandRegistration = async (id, rejectionReason) => {
  const body = await request(`/admin/brand-registrations/${encodeURIComponent(id)}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ rejectionReason }),
  });
  return body.data;
};

export const reinstateBrandRegistration = async (id) => {
  const body = await request(`/admin/brand-registrations/${encodeURIComponent(id)}/reinstate`, {
    method: "PATCH",
  });
  return body.data;
};
