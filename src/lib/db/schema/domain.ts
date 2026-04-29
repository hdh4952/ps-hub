import {
  pgTable, text, timestamp, integer, uuid, jsonb, primaryKey, uniqueIndex, check
} from "drizzle-orm/pg-core";
import { sql as raw } from "drizzle-orm";
import { users } from "./auth";

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ uniqUserName: uniqueIndex("groups_user_name_uniq").on(t.userId, t.name) }),
);

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    handle: text("handle").notNull(),
    handleLc: text("handle_lc").notNull(),
    alias: text("alias"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("favorites_user_platform_handle_uniq").on(t.userId, t.platform, t.handleLc),
    platformCheck: check("platform_chk", raw`${t.platform} IN ('atcoder','codeforces')`),
  }),
);

export const favoriteGroups = pgTable(
  "favorite_groups",
  {
    favoriteId: uuid("favorite_id").notNull().references(() => favorites.id, { onDelete: "cascade" }),
    groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.favoriteId, t.groupId] }) }),
);

export const cachedProfiles = pgTable(
  "cached_profiles",
  {
    platform: text("platform").notNull(),
    handleLc: text("handle_lc").notNull(),
    displayName: text("display_name"),
    currentRating: integer("current_rating"),
    maxRating: integer("max_rating"),
    rankLabel: text("rank_label"),
    rankColor: text("rank_color"),
    lastContests: jsonb("last_contests"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    fetchStatus: text("fetch_status").notNull(),
    fetchError: text("fetch_error"),
  },
  (t) => ({ pk: primaryKey({ columns: [t.platform, t.handleLc] }) }),
);
