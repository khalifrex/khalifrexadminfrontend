const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const apiCall = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return { success: true, ...data };
  } catch (error) {
    console.error(`Homepage API failed for ${endpoint}:`, error);
    return { success: false, error: error.message || "Network error" };
  }
};

export const getHomepage = () => apiCall("/homepage");
export const getCollection = (slug) => apiCall(`/homepage/collection/${slug}`);

export const getAdminHomepage = () => apiCall("/homepage/admin");

export const createSection = (payload) =>
  apiCall("/homepage/sections", { method: "POST", body: JSON.stringify(payload) });

export const updateSection = (sectionId, payload) =>
  apiCall(`/homepage/sections/${sectionId}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteSection = (sectionId) =>
  apiCall(`/homepage/sections/${sectionId}`, { method: "DELETE" });

export const reorderSections = (order) =>
  apiCall("/homepage/sections/reorder", { method: "PUT", body: JSON.stringify({ order }) });

export const listCollections = () => apiCall("/homepage/collections");
export const createCollection = (payload) =>
  apiCall("/homepage/collections", { method: "POST", body: JSON.stringify(payload) });
export const updateCollection = (id, payload) =>
  apiCall(`/homepage/collections/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteCollection = (id) =>
  apiCall(`/homepage/collections/${id}`, { method: "DELETE" });


export const uploadImage = async (file) => {
  try {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`${API_BASE}/homepage/upload`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return { success: true, url: data.url };
  } catch (error) {
    console.error("Image upload failed:", error);
    return { success: false, error: error.message };
  }
};

export const homepageService = {
  getHomepage,
  getCollection,
  getAdminHomepage,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  uploadImage,
};