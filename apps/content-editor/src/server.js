import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import heroRouter from "./routes/hero.js";
import heroTilesRouter from "./routes/heroTiles.js";
import narrativesRouter from "./routes/narratives.js";
import scripturesRouter from "./routes/scriptures.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: "2mb" }));

app.use("/api/hero", heroRouter);
app.use("/api/hero-tiles", heroTilesRouter);
app.use("/api/narratives", narrativesRouter);
app.use("/api/scriptures", scripturesRouter);

const publicDir = path.resolve(__dirname, "../public");
const previewStylesDir = path.resolve(__dirname, "../../../src/styles");

app.use("/preview-styles", express.static(previewStylesDir));
app.use(express.static(publicDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Content editor listening on http://localhost:${PORT}`);
});
