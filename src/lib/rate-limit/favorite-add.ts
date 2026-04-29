const lastAddAt = new Map<string, number>();
const WINDOW_MS = 5_000;

export function allowFavoriteAdd(userId: string): boolean {
  const now = Date.now();
  const last = lastAddAt.get(userId) ?? 0;
  if (now - last < WINDOW_MS) return false;
  lastAddAt.set(userId, now);
  return true;
}

export function _resetForTest() {
  lastAddAt.clear();
}
