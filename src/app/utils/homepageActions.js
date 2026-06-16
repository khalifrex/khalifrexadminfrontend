/**
 * Single source of truth for "where does clicking this go?".
 * Used by every homepage banner, card, and tile.
 *
 *   category   -> /category/{actionValue}                      (actionValue = categoryId)
 *   search     -> /search?q={actionValue}&maxPrice=..&minPrice=..&brands=..
 *   collection -> /collection/{actionValue}                    (actionValue = slug)
 *   url        -> {actionValue}                                 (internal path or external URL)
 *   none/empty -> null                                          (not clickable)
 *
 * Price params use minPrice/maxPrice to match your existing /category page
 * convention. See the SearchProducts patch so /search honors them too.
 */
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

/** True for links that should open in a new tab / bypass the SPA router. */
export function isExternalHref(href) {
  return typeof href === "string" && /^https?:\/\//i.test(href);
}