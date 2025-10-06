import { Router } from "express";
import db, { withTransaction } from "../db/index.js";

const router = Router();

const selectTiles = db.prepare(`
  SELECT id, position, scripture_id AS scriptureId
  FROM hero_tiles
  ORDER BY position ASC
`);

router.get("/", (_req, res) => {
  const rows = selectTiles.all();
  res.json(rows.map(mapTile));
});

function mapTile(row) {
  return {
    id: row.id,
    position: row.position,
    scriptureId: row.scriptureId,
  };
}

router.put("/", (req, res) => {
  const tiles = Array.isArray(req.body) ? req.body : req.body?.tiles;
  if (!Array.isArray(tiles)) {
    return res.status(400).json({ error: "Expected an array of tiles" });
  }

  try {
    withTransaction(() => {
      const deleteStmt = db.prepare("DELETE FROM hero_tiles");
      deleteStmt.run();
      const insertStmt = db.prepare(
        "INSERT INTO hero_tiles (position, scripture_id) VALUES (?, ?)"
      );
      tiles.forEach((tile, index) => {
        if (!tile || typeof tile.scriptureId !== "string") {
          throw new Error("Each tile must include a scriptureId");
        }
        const position = tile.position ?? index;
        insertStmt.run(position, tile.scriptureId.trim());
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  const rows = selectTiles.all();
  res.json(rows.map(mapTile));
});

export default router;
