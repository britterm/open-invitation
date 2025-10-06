import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "../data/content.db");
const migrationsDir = path.resolve(__dirname, "../migrations");

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.exec(`CREATE TABLE IF NOT EXISTS migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);`);

const migrations = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const appliedStmt = db.prepare("SELECT 1 FROM migrations WHERE name = ?");
const insertStmt = db.prepare("INSERT INTO migrations (name) VALUES (?)");

for (const migration of migrations) {
  const alreadyApplied = appliedStmt.get(migration);
  if (alreadyApplied) {
    console.log(`Skipping migration ${migration}`);
    continue;
  }

  const sql = fs.readFileSync(path.join(migrationsDir, migration), "utf-8");
  try {
    db.exec(sql);
    insertStmt.run(migration);
    console.log(`Applied migration ${migration}`);
  } catch (error) {
    console.error(`Failed to apply migration ${migration}`);
    console.error(error);
    process.exitCode = 1;
    break;
  }
}

db.close();
