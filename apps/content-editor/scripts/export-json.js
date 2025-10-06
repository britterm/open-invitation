import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import db from "../src/db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../../");
const outputDir = path.resolve(rootDir, "docs");
const jsonPath = path.join(outputDir, "content-export.json");
const modulePath = path.join(outputDir, "content-export.js");
const metaPath = path.join(outputDir, "content-meta.json");

ensureDir(outputDir);

const hero = loadHero();
const heroTiles = loadHeroTiles();
const narratives = loadNarratives();
const scriptures = loadScriptures();

const jsonOutput = JSON.stringify(scriptures, null, 2);
fs.writeFileSync(jsonPath, jsonOutput);
console.log(
  `Wrote ${scriptures.length} scriptures to ${path.relative(rootDir, jsonPath)}`,
);

const moduleOutput = `const scriptures = ${jsonOutput};\n\nexport default scriptures;\n`;
fs.writeFileSync(modulePath, moduleOutput);
console.log(`Wrote module export to ${path.relative(rootDir, modulePath)}`);

const metaPayload = {
  generatedAt: new Date().toISOString(),
  hero,
  heroTiles,
  narratives,
};

fs.writeFileSync(metaPath, JSON.stringify(metaPayload, null, 2));
console.log(`Wrote hero/narrative content to ${path.relative(rootDir, metaPath)}`);

db.close();

function loadHero() {
  const row = db
    .prepare(`
      SELECT
        title,
        description,
        image_path AS imagePath,
        image_alt AS imageAlt,
        primary_cta_label AS primaryLabel,
        primary_cta_href AS primaryHref,
        secondary_cta_label AS secondaryLabel,
        secondary_cta_href AS secondaryHref
      FROM hero
      WHERE id = 1
    `)
    .get();

  if (!row) return null;
  return {
    title: row.title ?? "",
    description: row.description ?? "",
    imagePath: row.imagePath ?? "",
    imageAlt: row.imageAlt ?? "",
    primaryCta: {
      label: row.primaryLabel ?? "",
      href: row.primaryHref ?? "",
    },
    secondaryCta: {
      label: row.secondaryLabel ?? "",
      href: row.secondaryHref ?? "",
    },
  };
}

function loadHeroTiles() {
  return db
    .prepare(`
      SELECT scripture_id AS scriptureId
      FROM hero_tiles
      ORDER BY position ASC
    `)
    .all()
    .map((row) => row.scriptureId);
}

function loadNarratives() {
  return db
    .prepare(`
      SELECT
        title,
        description,
        scripture_id AS scriptureId,
        image_path AS image,
        image_alt AS imageAlt,
        accent,
        position
      FROM narrative_sections
      ORDER BY position ASC, id ASC
    `)
    .all()
    .map((row) => ({
      title: row.title,
      description: row.description,
      scriptureId: row.scriptureId,
      image: row.image,
      imageAlt: row.imageAlt,
      accent: row.accent,
      position: row.position,
    }));
}

function loadScriptures() {
  const scriptures = db
    .prepare(`
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
      ORDER BY reference COLLATE NOCASE ASC
    `)
    .all();

  const themeRows = db
    .prepare(`
      SELECT scripture_id AS scriptureId, theme, position
      FROM scripture_themes
      ORDER BY scripture_id, position ASC, id ASC
    `)
    .all();
  const contextRows = db
    .prepare(`
      SELECT scripture_id AS scriptureId, heading, body, position
      FROM scripture_contexts
      ORDER BY scripture_id, position ASC, id ASC
    `)
    .all();
  const analysisRows = db
    .prepare(`
      SELECT scripture_id AS scriptureId, title, body, position
      FROM scripture_analysis
      ORDER BY scripture_id, position ASC, id ASC
    `)
    .all();
  const tensionRows = db
    .prepare(`
      SELECT scripture_id AS scriptureId, question, steelman, response
      FROM scripture_tension
    `)
    .all();
  const supportRows = db
    .prepare(`
      SELECT scripture_id AS scriptureId, support, position
      FROM scripture_tension_supports
      ORDER BY scripture_id, position ASC, id ASC
    `)
    .all();

  const themesById = groupBy(themeRows, "scriptureId");
  const contextsById = groupBy(contextRows, "scriptureId");
  const analysisById = groupBy(analysisRows, "scriptureId");
  const tensionById = Object.fromEntries(
    tensionRows.map((row) => [row.scriptureId, row])
  );
  const supportsById = groupBy(supportRows, "scriptureId");

  return scriptures.map((entry) => formatScripture(entry, {
    themes: themesById[entry.id] ?? [],
    contexts: contextsById[entry.id] ?? [],
    analysis: analysisById[entry.id] ?? [],
    tension: tensionById[entry.id],
    supports: supportsById[entry.id] ?? [],
  }));
}

function formatScripture(entry, relations) {
  const result = {
    id: entry.id,
  };

  if (entry.alignment) {
    result.alignment = entry.alignment;
  }
  if (entry.selectorCategory) {
    result.selectorCategory = entry.selectorCategory;
  }

  Object.assign(result, {
    reference: entry.reference,
    title: entry.title ?? "",
    translation: entry.translation ?? "",
    summary: entry.summary ?? "",
    keyVerse: entry.keyVerse ?? "",
    themes: relations.themes.map((row) => row.theme),
    category: entry.category ?? "",
    context: relations.contexts.map((row) => ({
      heading: row.heading ?? "",
      text: row.body ?? "",
    })),
    analysis: relations.analysis.map((row) => ({
      title: row.title ?? "",
      body: row.body ?? "",
    })),
  });

  const tension = mapTension(relations.tension, relations.supports);
  if (tension) {
    result.tensionResolution = tension;
  }

  return result;
}

function mapTension(tension, supports) {
  if (!tension) return null;
  const normalizedSupports = supports
    .map((row) => row.support)
    .filter((text) => typeof text === "string" && text.trim() !== "");

  if (
    !tension.question &&
    !tension.steelman &&
    !tension.response &&
    normalizedSupports.length === 0
  ) {
    return null;
  }

  const result = {
    question: tension.question ?? "",
    steelman: tension.steelman ?? "",
    response: tension.response ?? "",
  };

  if (normalizedSupports.length) {
    result.supports = normalizedSupports;
  }

  return result;
}

function groupBy(rows, key) {
  return rows.reduce((acc, row) => {
    const id = row[key];
    if (!acc[id]) acc[id] = [];
    acc[id].push(row);
    return acc;
  }, {});
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
