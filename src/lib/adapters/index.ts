import type { Platform, PlatformAdapter } from "./types";
import { codeforcesAdapter } from "./codeforces";
import { atcoderAdapter } from "./atcoder";

const registry: Record<Platform, PlatformAdapter> = {
  codeforces: codeforcesAdapter,
  atcoder: atcoderAdapter,
};

export function getAdapter(platform: Platform): PlatformAdapter {
  return registry[platform];
}

export type { PlatformAdapter, NormalizedProfile, NotFound, Platform } from "./types";
