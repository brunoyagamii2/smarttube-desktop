import Database from "better-sqlite3";
import path from "path";

// Initialize SQLite database
const dbPath = process.env.DATABASE_URL?.replace("file:", "") || path.join(process.cwd(), "smarttube.db");
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize database schema
export function initializeDatabase() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT UNIQUE NOT NULL,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT DEFAULT 'user',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastSignedIn DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- YouTube History (for anonymous users)
    CREATE TABLE IF NOT EXISTS youtubeHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      youtubeVideoId TEXT NOT NULL,
      title TEXT,
      author TEXT,
      thumbnail TEXT,
      watchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration INTEGER,
      watchedDuration INTEGER
    );

    -- YouTube Playlists (for anonymous users)
    CREATE TABLE IF NOT EXISTS youtubePlaylist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- YouTube Playlist Items
    CREATE TABLE IF NOT EXISTS youtubePlaylistItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlistId INTEGER NOT NULL,
      youtubeVideoId TEXT NOT NULL,
      title TEXT,
      author TEXT,
      thumbnail TEXT,
      position INTEGER,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playlistId) REFERENCES youtubePlaylist(id) ON DELETE CASCADE
    );

    -- YouTube Subscriptions
    CREATE TABLE IF NOT EXISTS youtubeSubscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      channelId TEXT NOT NULL,
      channelName TEXT,
      channelThumbnail TEXT,
      subscribedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sessionId, channelId)
    );

    -- Autoplay Queue
    CREATE TABLE IF NOT EXISTS autoplayQueue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      youtubeVideoId TEXT NOT NULL,
      position INTEGER,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User Settings
    CREATE TABLE IF NOT EXISTS userSettings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      sponsorBlockCategories TEXT DEFAULT 'sponsor,intro,outro,interaction',
      autoplay BOOLEAN DEFAULT 1,
      quality TEXT DEFAULT 'auto',
      theme TEXT DEFAULT 'dark',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sessionId)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_youtubeHistory_sessionId ON youtubeHistory(sessionId);
    CREATE INDEX IF NOT EXISTS idx_youtubeHistory_watchedAt ON youtubeHistory(watchedAt);
    CREATE INDEX IF NOT EXISTS idx_youtubePlaylistItems_playlistId ON youtubePlaylistItems(playlistId);
    CREATE INDEX IF NOT EXISTS idx_youtubeSubscriptions_sessionId ON youtubeSubscriptions(sessionId);
    CREATE INDEX IF NOT EXISTS idx_autoplayQueue_sessionId ON autoplayQueue(sessionId);
  `);
}

// ============= YOUTUBE HISTORY FUNCTIONS =============

export function addToYouTubeHistory(
  sessionId: string,
  youtubeVideoId: string,
  title: string,
  author: string,
  thumbnail: string,
  duration: number
) {
  const stmt = db.prepare(`
    INSERT INTO youtubeHistory (sessionId, youtubeVideoId, title, author, thumbnail, duration)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(sessionId, youtubeVideoId, title, author, thumbnail, duration);
}

export function getYouTubeHistory(sessionId: string, limit: number = 50) {
  const stmt = db.prepare(`
    SELECT * FROM youtubeHistory 
    WHERE sessionId = ? 
    ORDER BY watchedAt DESC 
    LIMIT ?
  `);
  return stmt.all(sessionId, limit);
}

export function updateWatchedDuration(historyId: number, duration: number) {
  const stmt = db.prepare(`
    UPDATE youtubeHistory 
    SET watchedDuration = ? 
    WHERE id = ?
  `);
  return stmt.run(duration, historyId);
}

// ============= YOUTUBE PLAYLIST FUNCTIONS =============

export function createYouTubePlaylist(sessionId: string, title: string, description: string = "") {
  const stmt = db.prepare(`
    INSERT INTO youtubePlaylist (sessionId, title, description)
    VALUES (?, ?, ?)
  `);
  return stmt.run(sessionId, title, description);
}

export function getYouTubePlaylists(sessionId: string) {
  const stmt = db.prepare(`
    SELECT * FROM youtubePlaylist 
    WHERE sessionId = ? 
    ORDER BY createdAt DESC
  `);
  return stmt.all(sessionId);
}

export function getYouTubePlaylistItems(playlistId: number) {
  const stmt = db.prepare(`
    SELECT * FROM youtubePlaylistItems 
    WHERE playlistId = ? 
    ORDER BY position ASC
  `);
  return stmt.all(playlistId);
}

export function addToYouTubePlaylist(
  playlistId: number,
  youtubeVideoId: string,
  title: string,
  author: string,
  thumbnail: string,
  position: number
) {
  const stmt = db.prepare(`
    INSERT INTO youtubePlaylistItems (playlistId, youtubeVideoId, title, author, thumbnail, position)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(playlistId, youtubeVideoId, title, author, thumbnail, position);
}

export function removeFromYouTubePlaylist(itemId: number) {
  const stmt = db.prepare("DELETE FROM youtubePlaylistItems WHERE id = ?");
  return stmt.run(itemId);
}

export function deleteYouTubePlaylist(playlistId: number) {
  const stmt = db.prepare("DELETE FROM youtubePlaylist WHERE id = ?");
  return stmt.run(playlistId);
}

// ============= YOUTUBE SUBSCRIPTIONS FUNCTIONS =============

export function subscribeToChannel(
  sessionId: string,
  channelId: string,
  channelName: string,
  channelThumbnail: string
) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO youtubeSubscriptions (sessionId, channelId, channelName, channelThumbnail)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(sessionId, channelId, channelName, channelThumbnail);
}

export function unsubscribeFromChannel(sessionId: string, channelId: string) {
  const stmt = db.prepare(`
    DELETE FROM youtubeSubscriptions 
    WHERE sessionId = ? AND channelId = ?
  `);
  return stmt.run(sessionId, channelId);
}

export function getSubscribedChannels(sessionId: string) {
  const stmt = db.prepare(`
    SELECT * FROM youtubeSubscriptions 
    WHERE sessionId = ? 
    ORDER BY subscribedAt DESC
  `);
  return stmt.all(sessionId);
}

export function isSubscribedToChannel(sessionId: string, channelId: string) {
  const stmt = db.prepare(`
    SELECT id FROM youtubeSubscriptions 
    WHERE sessionId = ? AND channelId = ?
    LIMIT 1
  `);
  return stmt.get(sessionId, channelId) !== undefined;
}

// ============= AUTOPLAY QUEUE FUNCTIONS =============

export function addToAutoplayQueue(sessionId: string, youtubeVideoId: string, position: number) {
  const stmt = db.prepare(`
    INSERT INTO autoplayQueue (sessionId, youtubeVideoId, position)
    VALUES (?, ?, ?)
  `);
  return stmt.run(sessionId, youtubeVideoId, position);
}

export function getAutoplayQueue(sessionId: string) {
  const stmt = db.prepare(`
    SELECT * FROM autoplayQueue 
    WHERE sessionId = ? 
    ORDER BY position ASC
  `);
  return stmt.all(sessionId);
}

export function clearAutoplayQueue(sessionId: string) {
  const stmt = db.prepare("DELETE FROM autoplayQueue WHERE sessionId = ?");
  return stmt.run(sessionId);
}

// ============= USER SETTINGS FUNCTIONS =============

export function getUserSettings(sessionId: string) {
  const stmt = db.prepare(`
    SELECT * FROM userSettings 
    WHERE sessionId = ? 
    LIMIT 1
  `);
  return stmt.get(sessionId);
}

export function updateUserSettings(
  sessionId: string,
  settings: {
    sponsorBlockCategories?: string;
    autoplay?: boolean;
    quality?: string;
    theme?: string;
  }
) {
  const stmt = db.prepare(`
    INSERT INTO userSettings (sessionId, sponsorBlockCategories, autoplay, quality, theme)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(sessionId) DO UPDATE SET
      sponsorBlockCategories = COALESCE(?, sponsorBlockCategories),
      autoplay = COALESCE(?, autoplay),
      quality = COALESCE(?, quality),
      theme = COALESCE(?, theme),
      updatedAt = CURRENT_TIMESTAMP
  `);

  return stmt.run(
    sessionId,
    settings.sponsorBlockCategories || "sponsor,intro,outro,interaction",
    settings.autoplay !== undefined ? (settings.autoplay ? 1 : 0) : 1,
    settings.quality || "auto",
    settings.theme || "dark",
    settings.sponsorBlockCategories,
    settings.autoplay !== undefined ? (settings.autoplay ? 1 : 0) : null,
    settings.quality,
    settings.theme
  );
}

// ============= DATABASE MANAGEMENT =============

export function closeDatabase() {
  db.close();
}

// Initialize database on import
initializeDatabase();
