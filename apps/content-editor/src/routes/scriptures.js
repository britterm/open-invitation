import { Router } from "express";
import db, { withTransaction } from "../db/index.js";

const router = Router();

const listStmt = db.prepare(`
  SELECT
    id,
    reference,
    title,
    summary,
    category,
    selector_category AS selectorCategory,
    alignment,
    translation,
    updated_at AS updatedAt
  FROM scriptures
  ORDER BY reference COLLATE NOCASE ASC
`);

const getStmt = db.prepare(`
  SELECT
    id,
    reference,
    title,
    translation,
    summary,
    key_verse AS keyVerse,
    category,
    selector_category AS selectorCategory,
    alignment
  FROM scriptures
  WHERE id = ?
`);

const insertStmt = db.prepare(`
  INSERT INTO scriptures (
    id,
    reference,
    title,
    translation,
    summary,
    key_verse,
    category,
    selector_category,
    alignment
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateStmt = db.prepare(`
  UPDATE scriptures
  SET
    reference = ?,
    title = ?,
    translation = ?,
    summary = ?,
    key_verse = ?,
    category = ?,
    selector_category = ?,
    alignment = ?,
    updated_at = datetime('now')
  WHERE id = ?
`);

const deleteStmt = db.prepare(`DELETE FROM scriptures WHERE id = ?`);

const selectThemes = db.prepare(`
  SELECT id, theme, position
  FROM scripture_themes
  WHERE scripture_id = ?
  ORDER BY position ASC, id ASC
`);
const deleteThemes = db.prepare(`DELETE FROM scripture_themes WHERE scripture_id = ?`);
const insertTheme = db.prepare(
  `INSERT INTO scripture_themes (scripture_id, theme, position) VALUES (?, ?, ?)`
);

const selectContexts = db.prepare(`
  SELECT id, heading, body, position
  FROM scripture_contexts
  WHERE scripture_id = ?
  ORDER BY position ASC, id ASC
`);
const deleteContexts = db.prepare(`DELETE FROM scripture_contexts WHERE scripture_id = ?`);
const insertContext = db.prepare(
  `INSERT INTO scripture_contexts (scripture_id, heading, body, position) VALUES (?, ?, ?, ?)`
);

const selectAnalysis = db.prepare(`
  SELECT id, title, body, position
  FROM scripture_analysis
  WHERE scripture_id = ?
  ORDER BY position ASC, id ASC
`);
const deleteAnalysis = db.prepare(`DELETE FROM scripture_analysis WHERE scripture_id = ?`);
const insertAnalysis = db.prepare(
  `INSERT INTO scripture_analysis (scripture_id, title, body, position) VALUES (?, ?, ?, ?)`
);

const selectBadges = db.prepare(`
  SELECT id, label, position
  FROM scripture_badges
  WHERE scripture_id = ?
  ORDER BY position ASC, id ASC
`);
const deleteBadges = db.prepare(`DELETE FROM scripture_badges WHERE scripture_id = ?`);
const insertBadge = db.prepare(
  `INSERT INTO scripture_badges (scripture_id, label, position) VALUES (?, ?, ?)`
);

const selectTension = db.prepare(`
  SELECT question, steelman, response
  FROM scripture_tension
  WHERE scripture_id = ?
`);
const upsertTension = db.prepare(`
  INSERT INTO scripture_tension (scripture_id, question, steelman, response)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(scripture_id) DO UPDATE SET
    question = excluded.question,
    steelman = excluded.steelman,
    response = excluded.response
`);
const deleteTension = db.prepare(
  `DELETE FROM scripture_tension WHERE scripture_id = ?`
);

const selectSupports = db.prepare(`
  SELECT id, support, position
  FROM scripture_tension_supports
  WHERE scripture_id = ?
  ORDER BY position ASC, id ASC
`);
const deleteSupports = db.prepare(
  `DELETE FROM scripture_tension_supports WHERE scripture_id = ?`
);
const insertSupport = db.prepare(
  `INSERT INTO scripture_tension_supports (scripture_id, support, position) VALUES (?, ?, ?)`
);

router.get("/", (_req, res) => {
  const rows = listStmt.all();
  res.json(rows.map(mapListRow));
});

router.get("/:id", (req, res) => {
  const scripture = getFullScripture(req.params.id);
  if (!scripture) {
    return res.status(404).json({ error: "Scripture not found" });
  }
  res.json(scripture);
});

router.post("/", (req, res) => {
  const payload = normalizeScripturePayload(req.body, { requireId: true });
  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  const existing = getStmt.get(payload.data.id);
  if (existing) {
    return res.status(409).json({ error: "A scripture with that id already exists" });
  }

  let created;
  try {
    withTransaction(() => {
      insertStmt.run(
        payload.data.id,
        payload.data.reference,
        payload.data.title,
        payload.data.translation,
        payload.data.summary,
        payload.data.keyVerse,
        payload.data.category,
        payload.data.selectorCategory,
        payload.data.alignment
      );
      replaceRelations(payload.data.id, payload.data);
      created = getFullScripture(payload.data.id);
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(created);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const existing = getStmt.get(id);
  if (!existing) {
    return res.status(404).json({ error: "Scripture not found" });
  }

  const payload = normalizeScripturePayload({ ...req.body, id }, { requireId: false });
  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  let updated;
  try {
    withTransaction(() => {
      updateStmt.run(
        payload.data.reference,
        payload.data.title,
        payload.data.translation,
        payload.data.summary,
        payload.data.keyVerse,
        payload.data.category,
        payload.data.selectorCategory,
        payload.data.alignment,
        id
      );
      replaceRelations(id, payload.data);
      updated = getFullScripture(id);
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  deleteStmt.run(id);
  res.status(204).end();
});

function mapListRow(row) {
  return {
    id: row.id,
    reference: row.reference,
    title: row.title,
    summary: row.summary,
    category: row.category,
    selectorCategory: row.selectorCategory,
    alignment: row.alignment,
    translation: row.translation,
    updatedAt: row.updatedAt,
  };
}

function getFullScripture(id) {
  const base = getStmt.get(id);
  if (!base) return null;
  const [themes, contexts, analysis, badges, tension, supports] = [
    selectThemes.all(id),
    selectContexts.all(id),
    selectAnalysis.all(id),
    selectBadges.all(id),
    selectTension.get(id),
    selectSupports.all(id),
  ];
  return {
    ...base,
    themes: themes.map((row) => row.theme),
    context: contexts.map((row) => ({
      id: row.id,
      heading: row.heading ?? "",
      text: row.body ?? "",
      position: row.position,
    })),
    analysis: analysis.map((row) => ({
      id: row.id,
      title: row.title ?? "",
      body: row.body ?? "",
      position: row.position,
    })),
    badges: badges.map((row) => ({
      id: row.id,
      label: row.label,
      position: row.position,
    })),
    tensionResolution: mapTension(tension, supports),
  };
}

function mapTension(tension, supports) {
  if (!tension && (!supports || supports.length === 0)) return null;
  return {
    question: tension?.question ?? "",
    steelman: tension?.steelman ?? "",
    response: tension?.response ?? "",
    supports: supports.map((row) => ({
      id: row.id,
      text: row.support,
      position: row.position,
    })),
  };
}

function replaceRelations(id, data) {
  deleteThemes.run(id);
  deleteContexts.run(id);
  deleteAnalysis.run(id);
  deleteBadges.run(id);
  deleteSupports.run(id);
  if (!data.tensionResolution || isTensionEmpty(data.tensionResolution)) {
    deleteTension.run(id);
  }

  const themes = Array.isArray(data.themes) ? data.themes : [];
  const contexts = Array.isArray(data.context) ? data.context : [];
  const analysis = Array.isArray(data.analysis) ? data.analysis : [];
  const badges = Array.isArray(data.badges) ? data.badges : [];
  const supports = Array.isArray(data.tensionResolution?.supports)
    ? data.tensionResolution.supports
    : [];

  themes.forEach((theme, index) => {
    if (typeof theme === "string" && theme.trim() !== "") {
      insertTheme.run(id, theme.trim(), index);
    }
  });

  contexts.forEach((entry, index) => {
    if (!entry) return;
    insertContext.run(
      id,
      entry.heading ?? null,
      entry.text ?? null,
      coercePosition(entry.position, index)
    );
  });

  analysis.forEach((entry, index) => {
    if (!entry) return;
    insertAnalysis.run(
      id,
      entry.title ?? null,
      entry.body ?? null,
      coercePosition(entry.position, index)
    );
  });

  badges.forEach((entry, index) => {
    if (!entry) return;
    const label = typeof entry === "string" ? entry : entry.label;
    if (label && label.trim() !== "") {
      insertBadge.run(id, label.trim(), coercePosition(entry.position, index));
    }
  });

  if (data.tensionResolution && !isTensionEmpty(data.tensionResolution)) {
    upsertTension.run(
      id,
      data.tensionResolution.question ?? null,
      data.tensionResolution.steelman ?? null,
      data.tensionResolution.response ?? null
    );
  }

  supports.forEach((entry, index) => {
    if (!entry) return;
    const text = typeof entry === "string" ? entry : entry.text;
    if (text && text.trim() !== "") {
      insertSupport.run(id, text.trim(), coercePosition(entry.position, index));
    }
  });
}

function isTensionEmpty(tension) {
  if (!tension) return true;
  const { question, steelman, response, supports } = tension;
  const hasText = [question, steelman, response].some(
    (value) => typeof value === "string" && value.trim() !== ""
  );
  const hasSupports = Array.isArray(supports)
    ? supports.some((entry) => {
        const text = typeof entry === "string" ? entry : entry?.text;
        return text && text.trim() !== "";
      })
    : false;
  return !hasText && !hasSupports;
}

function normalizeScripturePayload(body, { requireId } = { requireId: false }) {
  if (!body || typeof body !== "object") {
    return { error: "Payload must be an object" };
  }

  const id = typeof body.id === "string" ? body.id.trim() : null;
  if (requireId && !id) {
    return { error: "id is required" };
  }

  const reference = stringOrEmpty(body.reference);
  const title = stringOrEmpty(body.title);
  const translation = stringOrEmpty(body.translation);
  const summary = stringOrEmpty(body.summary);
  const keyVerse = stringOrEmpty(body.keyVerse);
  const category = stringOrNull(body.category);
  const selectorCategory = stringOrNull(body.selectorCategory);
  const alignment = stringOrNull(body.alignment);

  if (!reference || !title) {
    return { error: "reference and title are required" };
  }

  return {
    data: {
      id: id ?? body.id,
      reference,
      title,
      translation,
      summary,
      keyVerse,
      category,
      selectorCategory,
      alignment,
      themes: Array.isArray(body.themes) ? body.themes : [],
      context: Array.isArray(body.context) ? body.context : [],
      analysis: Array.isArray(body.analysis) ? body.analysis : [],
      badges: Array.isArray(body.badges) ? body.badges : [],
      tensionResolution: body.tensionResolution ?? null,
    },
  };
}

function stringOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

function stringOrNull(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text === "" ? null : text;
}


function coercePosition(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default router;
