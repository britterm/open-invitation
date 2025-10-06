import { Router } from "express";
import db from "../db/index.js";

const router = Router();

const heroSelect = db.prepare(`
  SELECT
    id,
    title,
    description,
    image_path AS imagePath,
    image_alt AS imageAlt,
    primary_cta_label AS primaryCtaLabel,
    primary_cta_href AS primaryCtaHref,
    secondary_cta_label AS secondaryCtaLabel,
    secondary_cta_href AS secondaryCtaHref
  FROM hero
  WHERE id = 1
`);

function mapHero(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    imagePath: row.imagePath ?? "",
    imageAlt: row.imageAlt ?? "",
    primaryCta: {
      label: row.primaryCtaLabel ?? "",
      href: row.primaryCtaHref ?? "",
    },
    secondaryCta: {
      label: row.secondaryCtaLabel ?? "",
      href: row.secondaryCtaHref ?? "",
    },
  };
}

router.get("/", (_req, res) => {
  const row = heroSelect.get();
  res.json(mapHero(row));
});

router.put("/", (req, res) => {
  const {
    title = "",
    description = "",
    imagePath = "",
    imageAlt = "",
    primaryCta = {},
    secondaryCta = {},
  } = req.body ?? {};

  if (typeof title !== "string" || typeof description !== "string") {
    return res.status(400).json({ error: "title and description must be strings" });
  }

  const update = db.prepare(`
    UPDATE hero
    SET
      title = ?,
      description = ?,
      image_path = ?,
      image_alt = ?,
      primary_cta_label = ?,
      primary_cta_href = ?,
      secondary_cta_label = ?,
      secondary_cta_href = ?
    WHERE id = 1
  `);

  update.run(
    title.trim(),
    description.trim(),
    imagePath ?? "",
    imageAlt ?? "",
    primaryCta.label ?? "",
    primaryCta.href ?? "",
    secondaryCta.label ?? "",
    secondaryCta.href ?? ""
  );

  const row = heroSelect.get();
  res.json(mapHero(row));
});

export default router;
