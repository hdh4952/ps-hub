const lastForceAt = new Map<string, number>();
const WINDOW_MS = 5_000;

export function allowForce(userId: string): boolean {
  const now = Date.now();
  const last = lastForceAt.get(userId) ?? 0;
  if (now - last < WINDOW_MS) return false;
  lastForceAt.set(userId, now);
  return true;
}

export function _resetForTest() {
  lastForceAt.clear();
}
