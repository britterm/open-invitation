# Repository Guidelines

## Project Structure & Module Organization
Open Invitation is a static site. Entry points live in `index.html` and `scripture.html`. JavaScript modules in `src/scripts/` orchestrate views and reuse helpers from `src/scripts/utils.js`. Study content resides in `src/data/scriptures.js`; update IDs and metadata there. Place imagery and downloadable assets in `src/img/` and `docs/` respectively.

## Build, Test, and Development Commands
No build step is required. Open `index.html` directly in a browser for quick checks. For a local server that mirrors production paths, run `npx serve .` from the repository root. Use `npx prettier@latest src/scripts/*.js` before sharing large JavaScript edits.

## Coding Style & Naming Conventions
JavaScript modules use ES imports, 2-space indentation, and single quotes. Favor descriptive camelCase identifiers (`getFeaturedScriptures`) and keep data IDs kebab-cased (`john-20-30-31`). When adding helper functions, export them from `src/scripts/utils.js` and import explicitly where used to avoid unused globals. Keep HTML sections semantic and pair new styles with component-specific classes in `src/styles/`.

## Testing Guidelines
There is no automated suite yet; rely on manual verification. After content or script changes, open both `index.html` and a representative `scripture.html?id=...` page to confirm timeline cards, scripture lookups, and navigation anchors still resolve. Check the browser console for warnings and validate that new assets load from the expected paths.

## Commit & Pull Request Guidelines
Commit messages in this project are short, present-tense summaries (e.g., "add promise image"). Group related changes per commit to aid future audits. Pull requests should outline intent, link any planning notes in `docs/`, and include screenshots or GIFs when UI elements change. Note any manual verification performed so reviewers can reproduce it quickly.
