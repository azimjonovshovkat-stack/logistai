const KEY = "logistai_recent_searches";
const MAX_ITEMS = 5;

export function getRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): string[] {
  try {
    const existing = getRecentSearches().filter((q) => q !== query);
    const next = [query, ...existing].slice(0, MAX_ITEMS);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return getRecentSearches();
  }
}
