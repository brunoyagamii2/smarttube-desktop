import Database from "better-sqlite3";
import path from "path";
import { InsertUser, users } from "../drizzle/schema";

// Create database connection
const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "smarttube.db");
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize tables
export function initializeDatabase() {
  // Create users table
  db.exec(`
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
    )
  `);

  // Create videos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      videoUrl TEXT NOT NULL,
      thumbnailUrl TEXT,
      duration INTEGER,
      fileSize INTEGER,
      mimeType TEXT,
      quality TEXT,
      views INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Create playlists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Create playlistItems table
  db.exec(`
    CREATE TABLE IF NOT EXISTS playlistItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlistId INTEGER NOT NULL,
      videoId INTEGER,
      youtubeVideoId TEXT,
      position INTEGER,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playlistId) REFERENCES playlists(id),
      FOREIGN KEY (videoId) REFERENCES videos(id)
    )
  `);

  // Create watchHistory table
  db.exec(`
    CREATE TABLE IF NOT EXISTS watchHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      videoId INTEGER,
      watchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration INTEGER,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (videoId) REFERENCES videos(id)
    )
  `);

  // Create youtubeHistory table
  db.exec(`
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
    )
  `);

  // Create userSettings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS userSettings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE,
      sponsorBlockCategories TEXT DEFAULT 'sponsor,intro,outro,interaction',
      autoplay BOOLEAN DEFAULT 1,
      quality TEXT DEFAULT 'auto',
      theme TEXT DEFAULT 'dark',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Create videoTranscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS videoTranscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      videoId INTEGER,
      youtubeVideoId TEXT,
      language TEXT,
      transcription TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (videoId) REFERENCES videos(id)
    )
  `);

  // Create youtubeSubscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS youtubeSubscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      channelId TEXT NOT NULL,
      channelName TEXT,
      channelThumbnail TEXT,
      subscribedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sessionId, channelId)
    )
  `);

  // Create youtubePlaylist table
  db.exec(`
    CREATE TABLE IF NOT EXISTS youtubePlaylist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create youtubePlaylistItems table
  db.exec(`
    CREATE TABLE IF NOT EXISTS youtubePlaylistItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlistId INTEGER NOT NULL,
      youtubeVideoId TEXT NOT NULL,
      title TEXT,
      author TEXT,
      thumbnail TEXT,
      position INTEGER,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playlistId) REFERENCES youtubePlaylist(id)
    )
  `);

  // Create autoplayQueue table
  db.exec(`
    CREATE TABLE IF NOT EXISTS autoplayQueue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      youtubeVideoId TEXT NOT NULL,
      position INTEGER,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const stmt = db.prepare(`
    INSERT INTO users (openId, name, email, loginMethod, role, lastSignedIn)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(openId) DO UPDATE SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      loginMethod = COALESCE(?, loginMethod),
      lastSignedIn = ?
  `);

  stmt.run(
    user.openId,
    user.name || null,
    user.email || null,
    user.loginMethod || null,
    user.role || "user",
    user.lastSignedIn || new Date(),
    user.name || null,
    user.email || null,
    user.loginMethod || null,
    new Date()
  );
}

export async function getUserByOpenId(openId: string) {
  const stmt = db.prepare("SELECT * FROM users WHERE openId = ? LIMIT 1");
  return stmt.get(openId);
}

export function closeDatabase() {
  db.close();
}

export { db };
