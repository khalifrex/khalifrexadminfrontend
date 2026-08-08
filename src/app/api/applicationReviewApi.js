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

export const APPLICATION_TYPES = [
  { value: "category_selling_existing", label: "Category Selling" },
  { value: "product_selling_existing", label: "Product Selling" },
  { value: "registered_brand_selling", label: "Registered Brand Selling" },
  { value: "catalog_authorization", label: "Catalog Authorization" },
  { value: "brand_name_approval", label: "Brand Name Approval" },
  { value: "gtin_exemption", label: "Product ID (GTIN) Exemption" },
];

export const fetchApplicationCounts = async () => {
  const body = await request(`/admin/applications/counts`);
  return body.data;
};

export const fetchApplications = async (type, { status = "pending", page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") params.set("status", status);
  const body = await request(`/admin/applications/${encodeURIComponent(type)}?${params.toString()}`);
  return body;
};

export const fetchApplicationDetail = async (type, id) => {
  const body = await request(`/admin/applications/${encodeURIComponent(type)}/${encodeURIComponent(id)}`);
  return body.data;
};

export const approveApplication = async (type, id, adminNotes) => {
  const body = await request(`/admin/applications/${encodeURIComponent(type)}/${encodeURIComponent(id)}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ adminNotes }),
  });
  return body.data;
};

export const rejectApplication = async (type, id, rejectionReason, adminNotes) => {
  const body = await request(`/admin/applications/${encodeURIComponent(type)}/${encodeURIComponent(id)}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ rejectionReason, adminNotes }),
  });
  return body.data;
};
