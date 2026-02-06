import { eq, desc, and, like, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  videos, 
  playlists, 
  playlistItems, 
  watchHistory, 
  userSettings,
  videoTranscriptions,
  InsertVideo,
  InsertPlaylist,
  InsertPlaylistItem,
  InsertWatchHistory,
  InsertUserSettings,
  InsertVideoTranscription
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER FUNCTIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= VIDEO FUNCTIONS =============

export async function createVideo(video: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(videos).values(video);
  return result;
}

export async function getVideoById(videoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
  return result[0];
}

export async function getVideosByUserId(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(videos)
    .where(eq(videos.userId, userId))
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function searchVideos(userId: number, query: string, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(videos)
    .where(
      and(
        eq(videos.userId, userId),
        like(videos.title, `%${query}%`)
      )
    )
    .orderBy(desc(videos.createdAt))
    .limit(limit);
}

export async function updateVideo(videoId: number, updates: Partial<InsertVideo>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(videos).set(updates).where(eq(videos.id, videoId));
}

export async function deleteVideo(videoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(videos).where(eq(videos.id, videoId));
}

export async function incrementVideoViews(videoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(videos)
    .set({ views: sql`${videos.views} + 1` })
    .where(eq(videos.id, videoId));
}

// ============= PLAYLIST FUNCTIONS =============

export async function createPlaylist(playlist: InsertPlaylist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(playlists).values(playlist);
  return result;
}

export async function getPlaylistsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(playlists)
    .where(eq(playlists.userId, userId))
    .orderBy(desc(playlists.createdAt));
}

export async function getPlaylistById(playlistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(playlists)
    .where(eq(playlists.id, playlistId))
    .limit(1);
  return result[0];
}

export async function updatePlaylist(playlistId: number, updates: Partial<InsertPlaylist>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(playlists).set(updates).where(eq(playlists.id, playlistId));
}

export async function deletePlaylist(playlistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all playlist items first
  await db.delete(playlistItems).where(eq(playlistItems.playlistId, playlistId));
  // Then delete the playlist
  return await db.delete(playlists).where(eq(playlists.id, playlistId));
}

// ============= PLAYLIST ITEM FUNCTIONS =============

export async function addVideoToPlaylist(item: InsertPlaylistItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(playlistItems).values(item);
}

export async function getPlaylistItems(playlistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: playlistItems.id,
      playlistId: playlistItems.playlistId,
      videoId: playlistItems.videoId,
      position: playlistItems.position,
      addedAt: playlistItems.addedAt,
      video: videos,
    })
    .from(playlistItems)
    .leftJoin(videos, eq(playlistItems.videoId, videos.id))
    .where(eq(playlistItems.playlistId, playlistId))
    .orderBy(playlistItems.position);
}

export async function removeVideoFromPlaylist(playlistItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(playlistItems).where(eq(playlistItems.id, playlistItemId));
}

export async function reorderPlaylistItems(playlistId: number, itemPositions: { id: number; position: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update positions in a transaction-like manner
  for (const item of itemPositions) {
    await db
      .update(playlistItems)
      .set({ position: item.position })
      .where(
        and(
          eq(playlistItems.id, item.id),
          eq(playlistItems.playlistId, playlistId)
        )
      );
  }
}

// ============= WATCH HISTORY FUNCTIONS =============

export async function upsertWatchHistory(history: InsertWatchHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if history exists
  const existing = await db
    .select()
    .from(watchHistory)
    .where(
      and(
        eq(watchHistory.userId, history.userId),
        eq(watchHistory.videoId, history.videoId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    return await db
      .update(watchHistory)
      .set({
        currentTime: history.currentTime,
        duration: history.duration,
        completed: history.completed,
        lastWatchedAt: new Date(),
      })
      .where(eq(watchHistory.id, existing[0]!.id));
  } else {
    // Insert new
    return await db.insert(watchHistory).values(history);
  }
}

export async function getWatchHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: watchHistory.id,
      userId: watchHistory.userId,
      videoId: watchHistory.videoId,
      currentTime: watchHistory.currentTime,
      duration: watchHistory.duration,
      completed: watchHistory.completed,
      lastWatchedAt: watchHistory.lastWatchedAt,
      video: videos,
    })
    .from(watchHistory)
    .leftJoin(videos, eq(watchHistory.videoId, videos.id))
    .where(eq(watchHistory.userId, userId))
    .orderBy(desc(watchHistory.lastWatchedAt))
    .limit(limit);
}

export async function getVideoWatchHistory(userId: number, videoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(watchHistory)
    .where(
      and(
        eq(watchHistory.userId, userId),
        eq(watchHistory.videoId, videoId)
      )
    )
    .limit(1);

  return result[0];
}

// ============= USER SETTINGS FUNCTIONS =============

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return result[0];
}

export async function upsertUserSettings(settings: InsertUserSettings) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, settings.userId))
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(userSettings)
      .set(settings)
      .where(eq(userSettings.userId, settings.userId));
  } else {
    return await db.insert(userSettings).values(settings);
  }
}

// ============= VIDEO TRANSCRIPTION FUNCTIONS =============

export async function createVideoTranscription(transcription: InsertVideoTranscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(videoTranscriptions).values(transcription);
}

export async function getVideoTranscriptions(videoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(videoTranscriptions)
    .where(eq(videoTranscriptions.videoId, videoId))
    .orderBy(desc(videoTranscriptions.createdAt));
}
