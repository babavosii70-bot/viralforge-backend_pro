import path from 'path';
import fs from 'fs';
import { JSONFilePreset } from 'lowdb/node';

const DB_PATH = path.resolve(process.cwd(), process.env.DB_PATH || 'data/db.json');
const DB_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface User {
  id: string;
  email: string;
  password: any;
  role: string;
  createdAt: string;
}

interface Video {
  id: string;
  userId: string;
  filename: string;
  originalPath: string;
  processedPath?: string;
  status: string;
  progress: number;
  script?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface Log {
  id: string;
  videoId: string;
  type: string;
  suggestion: string;
  timestamp: string;
}

interface Data {
  users: User[];
  videos: Video[];
  logs: Log[];
}

const defaultData: Data = { users: [], videos: [], logs: [] };

let db: any;

export const initDb = async () => {
  console.log("🛠️ Initializing JSON Database...");
  db = await JSONFilePreset<Data>(DB_PATH, defaultData);
  console.log("✅ JSON Database initialized.");
};

// Compatibility shim for SQL-like methods (Simplified)
export const run = async (sql: string, params: any[] = []): Promise<void> => {
  if (!db) await initDb();
  
  // Very crude SQL parser for insertion/update shims
  if (sql.includes("INSERT INTO users")) {
    const [id, email, password, role] = params;
    db.data.users.push({ id, email, password, role, createdAt: new Date().toISOString() });
  } else if (sql.includes("INSERT INTO videos")) {
    if (params.length === 7 && sql.includes("script")) {
       const [id, userId, filename, status, progress, script, createdAt] = params;
       db.data.videos.push({ id, userId, filename, originalPath: '', status, progress, script, views: 0, createdAt, updatedAt: createdAt });
    } else {
       const [id, userId, filename, originalPath, status, progress, createdAt] = params;
       db.data.videos.push({ id, userId, filename, originalPath, status, progress, views: 0, createdAt, updatedAt: createdAt });
    }
  } else if (sql.includes("UPDATE videos SET status = ?, progress = ?, processedPath = ?, updatedAt = ? WHERE id = ?")) {
     const [status, progress, processedPath, updatedAt, id] = params;
     const video = db.data.videos.find((v: any) => v.id === id);
     if (video) Object.assign(video, { status, progress, processedPath, updatedAt });
  } else if (sql.includes("UPDATE videos SET status = ?, progress = ?, updatedAt = ? WHERE id = ?")) {
     const [status, progress, updatedAt, id] = params;
     const video = db.data.videos.find((v: any) => v.id === id);
     if (video) Object.assign(video, { status, progress, updatedAt });
  } else if (sql.includes("UPDATE videos SET views = views + 1 WHERE id = ?")) {
     const [id] = params;
     const video = db.data.videos.find((v: any) => v.id === id);
     if (video) video.views++;
  } else if (sql.includes("INSERT INTO optimization_logs")) {
      const [id, videoId, type, suggestion, timestamp] = params;
      db.data.logs.push({ id, videoId, type, suggestion, timestamp });
  } else if (sql.includes("UPDATE videos SET status = 'FAILED'")) {
      const [id] = params;
      const video = db.data.videos.find((v: any) => v.id === id);
      if (video) video.status = 'FAILED';
  }

  await db.write();
};

export const get = async <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  if (!db) await initDb();

  if (sql.includes("FROM users WHERE email = ?")) {
     return db.data.users.find((u: any) => u.email === params[0]) as any;
  } else if (sql.includes("FROM videos WHERE id = ?")) {
     return db.data.videos.find((v: any) => v.id === params[0]) as any;
  } else if (sql.includes("FROM users WHERE id = ?")) {
     return db.data.users.find((u: any) => u.id === params[0]) as any;
  }
  return undefined;
};

export const all = async <T>(sql: string, params: any[] = []): Promise<T[]> => {
  if (!db) await initDb();

  if (sql.includes("FROM videos WHERE userId = ?")) {
    return db.data.videos.filter((v: any) => v.userId === params[0]).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)) as any;
  } else if (sql.includes("FROM videos ORDER BY createdAt DESC")) {
    return [...db.data.videos].sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)) as any;
  }
  return [];
};
