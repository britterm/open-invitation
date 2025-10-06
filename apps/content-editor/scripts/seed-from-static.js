import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import db, { withTransaction } from "../src/db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../../");

const scripturePath = path.resolve(rootDir, "src/data/scriptures.js");
const narrativesPath = path.resolve(rootDir, "src/data/narratives.js");

const HERO_SEED = {
  title:
    "Discover God's responsive call - and why the gospel invites a real decision.",
  description:
    "Journey through Scripture to see how God proclaims good news, calls all people to respond, and entrusts the Spirit to seal those who believe. Explore passages that celebrate divine initiative and genuine human response, reading each story in context to see how the invitation unfolds.",
  imagePath: "src/img/home.png",
  imageAlt:
    "Sunlit open Bible drawing listeners toward the good news",
  primaryCta: { label: "Walk the Story", href: "#story" },
  secondaryCta: { label: "Explore Passages", href: "#spotlights" },
};

const HERO_TILE_IDS = [
  "isaiah-55-1-3",
  "john-20-30-31",
  "ephesians-1-13-14",
];

async function loadModule(modulePath) {
  const moduleUrl = pathToFileURL(modulePath).href;
  return import(moduleUrl);
}

async function main() {
  const scripturesModule = await loadModule(scripturePath);
  const narrativesModule = await loadModule(narrativesPath);

  const scriptures = scripturesModule.default ?? [];
  const narratives = narrativesModule.default ?? [];

  withTransaction(() => {
    seedHero();
    seedScriptures(scriptures);
    seedHeroTiles(HERO_TILE_IDS);
    seedNarratives(narratives);
  });

  console.log(`Seeded ${scriptures.length} scriptures and ${narratives.length} narratives`);
}

function seedHero() {
  const stmt = db.prepare(`
    UPDATE hero
    SET title = ?, description = ?, image_path = ?, image_alt = ?,
        primary_cta_label = ?, primary_cta_href = ?,
        secondary_cta_label = ?, secondary_cta_href = ?
    WHERE id = 1
  `);
  stmt.run(
    HERO_SEED.title,
    HERO_SEED.description,
    HERO_SEED.imagePath,
    HERO_SEED.imageAlt,
    HERO_SEED.primaryCta.label,
    HERO_SEED.primaryCta.href,
    HERO_SEED.secondaryCta.label,
    HERO_SEED.secondaryCta.href
  );
}

function seedScriptures(scriptures) {
  db.prepare("DELETE FROM scriptures").run();

  const insertScripture = db.prepare(`
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

  const insertTheme = db.prepare(
    `INSERT INTO scripture_themes (scripture_id, theme, position) VALUES (?, ?, ?)`
  );
  const insertContext = db.prepare(
    `INSERT INTO scripture_contexts (scripture_id, heading, body, position) VALUES (?, ?, ?, ?)`
  );
  const insertAnalysis = db.prepare(
    `INSERT INTO scripture_analysis (scripture_id, title, body, position) VALUES (?, ?, ?, ?)`
  );
  const insertBadge = db.prepare(
    `INSERT INTO scripture_badges (scripture_id, label, position) VALUES (?, ?, ?)`
  );
  const upsertTension = db.prepare(
    `INSERT INTO scripture_tension (scripture_id, question, steelman, response)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(scripture_id) DO UPDATE SET
       question = excluded.question,
       steelman = excluded.steelman,
       response = excluded.response`
  );
  const deleteTension = db.prepare(
    `DELETE FROM scripture_tension WHERE scripture_id = ?`
  );
  const insertSupport = db.prepare(
    `INSERT INTO scripture_tension_supports (scripture_id, support, position) VALUES (?, ?, ?)`
  );

  scriptures.forEach((entry) => {
    insertScripture.run(
      entry.id,
      entry.reference,
      entry.title ?? null,
      entry.translation ?? null,
      entry.summary ?? null,
      entry.keyVerse ?? null,
      entry.category ?? null,
      entry.selectorCategory ?? null,
      entry.alignment ?? null
    );

    (entry.themes ?? []).forEach((theme, index) => {
      if (typeof theme === "string" && theme.trim() !== "") {
        insertTheme.run(entry.id, theme.trim(), index);
      }
    });

    (entry.context ?? []).forEach((context, index) => {
      insertContext.run(
        entry.id,
        context.heading ?? null,
        context.text ?? null,
        index
      );
    });

    (entry.analysis ?? []).forEach((analysis, index) => {
      insertAnalysis.run(
        entry.id,
        analysis.title ?? null,
        analysis.body ?? null,
        index
      );
    });

    (entry.badges ?? []).forEach((badge, index) => {
      const label = typeof badge === "string" ? badge : badge?.label;
      if (label && label.trim() !== "") {
        insertBadge.run(entry.id, label.trim(), index);
      }
    });

    const tension = entry.tensionResolution;
    if (tension && !isTensionEmpty(tension)) {
      upsertTension.run(
        entry.id,
        tension.question ?? null,
        tension.steelman ?? null,
        tension.response ?? null
      );
      (tension.supports ?? []).forEach((support, index) => {
        const text = typeof support === "string" ? support : support?.text;
        if (text && text.trim() !== "") {
          insertSupport.run(entry.id, text.trim(), index);
        }
      });
    } else {
      deleteTension.run(entry.id);
    }
  });
}

function seedHeroTiles(ids) {
  const insertTile = db.prepare(
    `INSERT INTO hero_tiles (position, scripture_id) VALUES (?, ?)`
  );
  db.prepare("DELETE FROM hero_tiles").run();
  ids.forEach((id, index) => {
    insertTile.run(index, id);
  });
}

function seedNarratives(narratives) {
  const insertNarrative = db.prepare(`
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
  db.prepare("DELETE FROM narrative_sections").run();
  narratives.forEach((entry, index) => {
    insertNarrative.run(
      entry.title,
      entry.description,
      entry.scriptureId ?? null,
      entry.image ?? null,
      entry.imageAlt ?? null,
      entry.accent ?? null,
      index
    );
  });
}

function isTensionEmpty(tension) {
  if (!tension) return true;
  const { question, steelman, response, supports } = tension;
  const hasText = [question, steelman, response].some(
    (value) => typeof value === "string" && value.trim() !== ""
  );
  const hasSupports = Array.isArray(supports)
    ? supports.some((support) => {
        const text = typeof support === "string" ? support : support?.text;
        return text && text.trim() !== "";
      })
    : false;
  return !hasText && !hasSupports;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

