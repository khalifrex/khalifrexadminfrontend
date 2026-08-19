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

export const fetchSupportTickets = async ({ status, channel, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") params.set("status", status);
  if (channel && channel !== "all") params.set("channel", channel);
  return request(`/admin/support/tickets?${params.toString()}`);
};

export const fetchSupportTicketDetail = async (ticketId) =>
  request(`/admin/support/tickets/${ticketId}`);

export const sendTicketFollowUpEmail = async (ticketId, message) =>
  request(`/admin/support/tickets/${ticketId}/email`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });

export const resolveSupportTicket = async (ticketId) =>
  request(`/admin/support/tickets/${ticketId}/resolve`, { method: "POST" });
