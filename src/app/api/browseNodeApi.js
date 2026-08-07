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

export const fetchBrowseNodeRoots = async () => {
  const body = await request("/browse-nodes/roots");
  return body.data || [];
};

export const fetchBrowseNodeChildren = async (browseNodeId) => {
  const body = await request(
    `/browse-nodes/${encodeURIComponent(browseNodeId)}/children`,
  );
  return body.data || [];
};

export const fetchBrowseNode = async (browseNodeId) => {
  const body = await request(`/browse-nodes/${encodeURIComponent(browseNodeId)}`);
  return body.data;
};

export const fetchBrowseNodeBreadcrumbs = async (browseNodeId) => {
  const body = await request(
    `/browse-nodes/${encodeURIComponent(browseNodeId)}/breadcrumbs`,
  );
  return body.data || [];
};

export const createBrowseNode = async (payload) => {
  const body = await request("/browse-nodes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return body.data;
};

export const renameBrowseNode = async (browseNodeId, name) => {
  const body = await request(
    `/browse-nodes/${encodeURIComponent(browseNodeId)}/rename`,
    { method: "PATCH", body: JSON.stringify({ name }) },
  );
  return body.data;
};

export const addBrowseNodeParent = async (browseNodeId, parentNodeId) => {
  const body = await request(
    `/browse-nodes/${encodeURIComponent(browseNodeId)}/parents`,
    { method: "POST", body: JSON.stringify({ parentNodeId }) },
  );
  return body.data;
};

export const removeBrowseNodeParent = async (browseNodeId, parentNodeId) => {
  const body = await request(
    `/browse-nodes/${encodeURIComponent(browseNodeId)}/parents/${encodeURIComponent(parentNodeId)}`,
    { method: "DELETE" },
  );
  return body.data;
};

export const updateBrowseNodeDetails = async (browseNodeId, payload) => {
  const body = await request(
    `/browse-nodes/${encodeURIComponent(browseNodeId)}/details`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
  return body.data;
};

export const uploadBrowseNodeImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${BASE_URL}/browse-nodes/upload-image`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {}
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || `Upload failed (${res.status})`);
  }
  return body.url;
};

export const makeBrowseNodeSellable = async (browseNodeId, payload) => {
  const body = await request(
    `/browse-nodes/${encodeURIComponent(browseNodeId)}/sellable`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
  return body.data;
};

export const toggleBrowseNodeStatus = async (browseNodeId, isActive) => {
  const body = await request(
    `/browse-nodes/${encodeURIComponent(browseNodeId)}/toggle-status`,
    { method: "PATCH", body: JSON.stringify({ isActive }) },
  );
  return body.data;
};

export const deleteBrowseNode = async (browseNodeId) => {
  return request(`/browse-nodes/${encodeURIComponent(browseNodeId)}`, {
    method: "DELETE",
  });
};
