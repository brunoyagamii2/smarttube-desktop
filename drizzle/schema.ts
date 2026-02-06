import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, boolean, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Videos table - stores all video metadata
 */
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration").notNull(), // in seconds
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  quality: varchar("quality", { length: 20 }), // 720p, 1080p, 4K, 8K
  views: int("views").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Playlists table - user-created playlists
 */
export const playlists = mysqlTable("playlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnailUrl"),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;

/**
 * Playlist items - videos in playlists with ordering
 */
export const playlistItems = mysqlTable("playlistItems", {
  id: int("id").autoincrement().primaryKey(),
  playlistId: int("playlistId").notNull(),
  videoId: int("videoId").notNull(),
  position: int("position").notNull(), // order in playlist
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type PlaylistItem = typeof playlistItems.$inferSelect;
export type InsertPlaylistItem = typeof playlistItems.$inferInsert;

/**
 * Watch history - tracks video playback progress
 */
export const watchHistory = mysqlTable("watchHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoId: int("videoId").notNull(),
  currentTime: float("currentTime").notNull(), // playback position in seconds
  duration: float("duration").notNull(), // total duration at time of watch
  completed: boolean("completed").default(false).notNull(),
  lastWatchedAt: timestamp("lastWatchedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WatchHistory = typeof watchHistory.$inferSelect;
export type InsertWatchHistory = typeof watchHistory.$inferInsert;

/**
 * User settings - preferences for playback and features
 */
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  defaultPlaybackSpeed: float("defaultPlaybackSpeed").default(1.0).notNull(),
  defaultQuality: varchar("defaultQuality", { length: 20 }).default("auto"),
  autoplay: boolean("autoplay").default(true).notNull(),
  sponsorBlockEnabled: boolean("sponsorBlockEnabled").default(true).notNull(),
  sponsorBlockCategories: json("sponsorBlockCategories").$type<string[]>().default(["sponsor", "intro", "outro", "selfpromo"]),
  autoGenerateCaptions: boolean("autoGenerateCaptions").default(false).notNull(),
  theme: mysqlEnum("theme", ["light", "dark", "system"]).default("dark").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Video transcriptions - generated captions/subtitles
 */
export const videoTranscriptions = mysqlTable("videoTranscriptions", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  language: varchar("language", { length: 10 }).notNull(),
  transcription: text("transcription").notNull(), // VTT or SRT format
  generatedBy: varchar("generatedBy", { length: 50 }).default("whisper").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoTranscription = typeof videoTranscriptions.$inferSelect;
export type InsertVideoTranscription = typeof videoTranscriptions.$inferInsert;

/**
 * YouTube watch history - tracks YouTube video playback (no auth required)
 */
export const youtubeHistory = mysqlTable("youtubeHistory", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  youtubeVideoId: varchar("youtubeVideoId", { length: 20 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  channelName: varchar("channelName", { length: 255 }),
  channelId: varchar("channelId", { length: 64 }),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration").notNull().default(0),
  currentTime: float("currentTime").notNull().default(0),
  completed: boolean("completed").default(false).notNull(),
  lastWatchedAt: timestamp("lastWatchedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type YouTubeHistory = typeof youtubeHistory.$inferSelect;
export type InsertYouTubeHistory = typeof youtubeHistory.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  videos: many(videos),
  playlists: many(playlists),
  watchHistory: many(watchHistory),
  settings: one(userSettings),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
  playlistItems: many(playlistItems),
  watchHistory: many(watchHistory),
  transcriptions: many(videoTranscriptions),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  items: many(playlistItems),
}));

export const playlistItemsRelations = relations(playlistItems, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistItems.playlistId],
    references: [playlists.id],
  }),
  video: one(videos, {
    fields: [playlistItems.videoId],
    references: [videos.id],
  }),
}));

export const watchHistoryRelations = relations(watchHistory, ({ one }) => ({
  user: one(users, {
    fields: [watchHistory.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [watchHistory.videoId],
    references: [videos.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const videoTranscriptionsRelations = relations(videoTranscriptions, ({ one }) => ({
  video: one(videos, {
    fields: [videoTranscriptions.videoId],
    references: [videos.id],
  }),
}));
