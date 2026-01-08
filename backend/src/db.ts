import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';
import { config } from './config';

let database: Database | null = null;

const ensureDirectory = () => {
  const dir = path.dirname(config.sqlitePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const isInMemory = () => config.sqlitePath === ':memory:';

const resolveSqlJsDist = () => {
  const distPath = path.dirname(require.resolve('sql.js/dist/sql-wasm.js'));
  return distPath;
};

const persist = () => {
  if (!database || isInMemory()) {
    return;
  }
  const data = database.export();
  fs.writeFileSync(config.sqlitePath, Buffer.from(data));
};

export const initDb = async (): Promise<Database> => {
  if (database) {
    return database;
  }

  if (!isInMemory()) {
    ensureDirectory();
  }

  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(resolveSqlJsDist(), file)
  });

  const shouldBootstrap = !isInMemory() && fs.existsSync(config.sqlitePath);
  const fileBuffer = shouldBootstrap ? fs.readFileSync(config.sqlitePath) : undefined;
  database = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();

  database.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      sender_name TEXT,
      receiver_id TEXT,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Ensure `sender_name` column exists for older databases created without it
  const infoStmt = database.prepare("PRAGMA table_info(messages);");
  const cols: string[] = [];
  while (infoStmt.step()) {
    const row = infoStmt.getAsObject();
    cols.push(String((row as any).name));
  }
  infoStmt.free();
  if (!cols.includes('sender_name')) {
    database.run(`ALTER TABLE messages ADD COLUMN sender_name TEXT;`);
  }

  return database;
};

const requireDb = (): Database => {
  if (!database) {
    throw new Error('Database not initialized. Call initDb() before accessing it.');
  }
  return database;
};

export const readDb = <T>(fn: (db: Database) => T): T => {
  const db = requireDb();
  return fn(db);
};

export const writeDb = <T>(fn: (db: Database) => T): T => {
  const db = requireDb();
  const result = fn(db);
  persist();
  return result;
};
