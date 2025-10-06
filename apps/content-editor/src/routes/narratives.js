import { Router } from "express";
import db from "../db/index.js";

const router = Router();

const selectAll = db.prepare(`
  SELECT
    id,
    title,
    description,
    scripture_id AS scriptureId,
    image_path AS imagePath,
    image_alt AS imageAlt,
    accent,
    position
  FROM narrative_sections
  ORDER BY position ASC, id ASC
`);

const selectById = db.prepare(`
  SELECT
    id,
    title,
    description,
    scripture_id AS scriptureId,
    image_path AS imagePath,
    image_alt AS imageAlt,
    accent,
    position
  FROM narrative_sections
  WHERE id = ?
`);

const insertStmt = db.prepare(`
  INSERT INTO narrative_sections (
    title,
    description,
    scripture_id,
    image_path,
    image_alt,
    accent,
    position
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const updateStmt = db.prepare(`
  UPDATE narrative_sections
  SET
    title = ?,
    description = ?,
    scripture_id = ?,
    image_path = ?,
    image_alt = ?,
    accent = ?,
    position = ?
  WHERE id = ?
`);

const deleteStmt = db.prepare(`DELETE FROM narrative_sections WHERE id = ?`);

function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    scriptureId: row.scriptureId,
    imagePath: row.imagePath,
    imageAlt: row.imageAlt,
    accent: row.accent,
    position: row.position,
  };
}

router.get("/", (_req, res) => {
  const rows = selectAll.all();
  res.json(rows.map(mapRow));
});

router.post("/", (req, res) => {
  const {
    title,
    description,
    scriptureId = null,
    imagePath = null,
    imageAlt = null,
    accent = null,
    position = null,
  } = req.body ?? {};

  if (!title || !description) {
    return res.status(400).json({ error: "title and description are required" });
  }

  const resolvedPosition =
    typeof position === "number" ? position : computeNextPosition();

  const info = insertStmt.run(
    title,
    description,
    scriptureId ?? null,
    imagePath ?? null,
    imageAlt ?? null,
    accent ?? null,
    resolvedPosition
  );

  const created = selectById.get(info.lastInsertRowid);
  res.status(201).json(mapRow(created));
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = selectById.get(id);
  if (!existing) {
    return res.status(404).json({ error: "Narrative not found" });
  }

  const {
    title = existing.title,
    description = existing.description,
    scriptureId = existing.scriptureId,
    imagePath = existing.imagePath,
    imageAlt = existing.imageAlt,
    accent = existing.accent,
    position = existing.position,
  } = req.body ?? {};

  updateStmt.run(
    title,
    description,
    scriptureId ?? null,
    imagePath ?? null,
    imageAlt ?? null,
    accent ?? null,
    typeof position === "number" ? position : existing.position,
    id
  );

  const updated = selectById.get(id);
  res.json(mapRow(updated));
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  deleteStmt.run(id);
  res.status(204).end();
});

function computeNextPosition() {
  const row = db.prepare(
    "SELECT MAX(position) as maxPosition FROM narrative_sections"
  ).get();
  return (row?.maxPosition ?? 0) + 1;
}

export default router;
