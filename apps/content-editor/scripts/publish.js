import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../../");
const exportPath = path.join(rootDir, "docs/content-export.json");
const metaPath = path.join(rootDir, "docs/content-meta.json");
const scripturesPath = path.join(rootDir, "src/data/scriptures.js");
const narrativesPath = path.join(rootDir, "src/data/narratives.js");

// Read the exported data
const exportedScriptures = JSON.parse(fs.readFileSync(exportPath, "utf-8"));
const metaData = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

// ===== Publish Scriptures =====
const scripturesContent = fs.readFileSync(scripturesPath, "utf-8");

// Find the scripturesData array and everything after it
const dataStartMatch = scripturesContent.match(/const scripturesData = \[/);
if (!dataStartMatch) {
  console.error("Could not find scripturesData array in scriptures.js");
  process.exit(1);
}

const dataStartIndex = dataStartMatch.index;
const beforeData = scripturesContent.substring(0, dataStartIndex);

// Find the sorting functions and export (everything after the array)
const sortingFunctionsMatch = scripturesContent.match(/\n\];(\n\n\/\/ Sort by canonical[\s\S]*)/);
if (!sortingFunctionsMatch) {
  console.error("Could not find sorting functions after scripturesData array");
  process.exit(1);
}

const afterData = sortingFunctionsMatch[1];

// Build the new scriptures file content
const newDataString = JSON.stringify(exportedScriptures, null, 2);
const newScripturesContent = `${beforeData}const scripturesData = ${newDataString}];${afterData}`;

// Write the updated scriptures file
fs.writeFileSync(scripturesPath, newScripturesContent, "utf-8");
console.log(`✓ Published ${exportedScriptures.length} scriptures to ${path.relative(rootDir, scripturesPath)}`);

// ===== Publish Narratives =====
const narrativesContent = fs.readFileSync(narrativesPath, "utf-8");

// Remove the position field from narratives (not used in narratives.js)
const cleanedNarratives = metaData.narratives.map(({ position, ...rest }) => rest);

// Find the narratives array
const narrativesStartMatch = narrativesContent.match(/const narratives = \[/);
if (!narrativesStartMatch) {
  console.error("Could not find narratives array in narratives.js");
  process.exit(1);
}

const narrativesStartIndex = narrativesStartMatch.index;
const beforeNarratives = narrativesContent.substring(0, narrativesStartIndex);

// Find the export statement (everything after the array)
const narrativesEndMatch = narrativesContent.match(/\n\];(\n\nexport default narratives;[\s\S]*)/);
if (!narrativesEndMatch) {
  console.error("Could not find export statement after narratives array");
  process.exit(1);
}

const afterNarratives = narrativesEndMatch[1];

// Build the new narratives file content
const newNarrativesString = JSON.stringify(cleanedNarratives, null, 2);
const newNarrativesContent = `${beforeNarratives}const narratives = ${newNarrativesString}];${afterNarratives}`;

// Write the updated narratives file
fs.writeFileSync(narrativesPath, newNarrativesContent, "utf-8");
console.log(`✓ Published ${cleanedNarratives.length} narratives to ${path.relative(rootDir, narrativesPath)}`);
