export function buildActionHref(action) {
  if (!action) return null;
  const { actionType, actionValue, actionParams } = action;
  const value = (actionValue ?? "").toString().trim();

  switch (actionType) {
    case "category":
      return value ? `/category/${encodeURIComponent(value)}` : null;

    case "search": {
      if (!value && !actionParams) return null;
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      const p = actionParams || {};
      if (p.minPrice != null && p.minPrice !== "") params.set("minPrice", String(p.minPrice));
      if (p.maxPrice != null && p.maxPrice !== "") params.set("maxPrice", String(p.maxPrice));
      if (Array.isArray(p.brands) && p.brands.length) params.set("brands", p.brands.join(","));
      if (Array.isArray(p.condition) && p.condition.length)
        params.set("condition", p.condition.join(","));
      if (p.sortBy) params.set("sortBy", p.sortBy);
      const qs = params.toString();
      return `/search${qs ? `?${qs}` : ""}`;
    }

    case "collection":
      return value ? `/collection/${encodeURIComponent(value)}` : null;

    case "url":
      return value || null;

    case "none":
    default:
      return null;
  }
}


export function isExternalHref(href) {
  return typeof href === "string" && /^https?:\/\//i.test(href);
}