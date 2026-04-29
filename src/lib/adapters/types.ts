export type Platform = "atcoder" | "codeforces";

export type ContestEntry = {
  name: string;
  date: string;          // ISO 8601
  performance?: number;  // AtCoder only
  newRating: number;
  delta: number;
};

export type NormalizedProfile = {
  displayName: string;
  currentRating: number;
  maxRating: number;
  rankLabel: string;
  rankColor: string;
  lastContests: ContestEntry[];
};

export type NotFound = { kind: "not_found" };

export interface PlatformAdapter {
  platform: Platform;
  fetch(handle: string): Promise<NormalizedProfile | NotFound>;
}
