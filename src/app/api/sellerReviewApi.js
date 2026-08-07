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

export const fetchSellerApplications = async ({ status = "submitted", page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ status, page: String(page), limit: String(limit) });
  const body = await request(`/admin/sellers/review?${params.toString()}`);
  return body;
};

export const fetchSellerApplicationDetail = async (sellerId) => {
  const body = await request(`/admin/sellers/${encodeURIComponent(sellerId)}`);
  return body.data;
};

export const verifySellerApplication = async (sellerId) => {
  const body = await request(`/admin/sellers/${encodeURIComponent(sellerId)}/verify`, {
    method: "PATCH",
  });
  return body.data;
};

export const rejectSellerApplication = async (sellerId, reasons) => {
  const body = await request(`/admin/sellers/${encodeURIComponent(sellerId)}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reasons }),
  });
  return body.data;
};
