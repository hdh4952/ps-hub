import type { Platform, PlatformAdapter } from "./types";
import { codeforcesAdapter } from "./codeforces";

// atcoder added in Task 3.3
const registry: Partial<Record<Platform, PlatformAdapter>> = {
  codeforces: codeforcesAdapter,
};

export function getAdapter(platform: Platform): PlatformAdapter {
  const adapter = registry[platform];
  if (!adapter) throw new Error(`adapter not implemented: ${platform}`);
  return adapter;
}
export type { PlatformAdapter, NormalizedProfile, NotFound, Platform } from "./types";
