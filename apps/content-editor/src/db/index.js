import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "../../data/content.db");

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

export default db;

export function withTransaction(handler) {
  const transaction = db.transaction(handler);
  return transaction();
}
