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

export const fetchAtozClaims = async ({ status, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") params.set("status", status);
  return request(`/admin/claims/atoz?${params.toString()}`);
};

export const fetchAtozClaimDetail = async (claimId) =>
  request(`/admin/claims/atoz/${claimId}`);

export const decideAtozClaim = async (claimId, outcome, notes) =>
  request(`/admin/claims/atoz/${claimId}/decide`, {
    method: "POST",
    body: JSON.stringify({ outcome, notes }),
  });

export const fetchSafeTClaims = async ({ status, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") params.set("status", status);
  return request(`/admin/claims/safet?${params.toString()}`);
};

export const fetchSafeTClaimDetail = async (claimId) =>
  request(`/admin/claims/safet/${claimId}`);

export const decideSafeTClaim = async (claimId, outcome, reimbursedAmount, notes) =>
  request(`/admin/claims/safet/${claimId}/decide`, {
    method: "POST",
    body: JSON.stringify({ outcome, reimbursedAmount, notes }),
  });
