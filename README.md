# open-invitation

God calls us with an open invitation into his kingdom - come explore the evidence! Open Invitation is a static site experience that invites visitors to hear the story of redemption, trace the call to respond in faith, and examine Scripture directly. The project emphasizes that faith comes by hearing the gospel rather than by secret regeneration, highlighting twenty foundational passages with narrative storytelling and exegetical commentary.

## Getting Started
1. Open `index.html` in your browser to view the landing page.
2. Follow any Scripture link (for example, `scripture.html?id=romans-10-17`) to dive into the contextual study and commentary.
3. Content is driven from `src/data/scriptures.js`, making it simple to add new passages or adjust analysis.

## Project Structure
- `docs/PLAN.md` – Project vision, goals, and roadmap.
- `index.html` – Landing page with narrative timeline and scripture spotlights.
- `scripture.html` – Scripture explorer page rendering context and commentary for a selected passage.
- `src/data/scriptures.js` – Scripture dataset including references, context, and analysis.
- `src/scripts/` – JavaScript modules for rendering the landing page and scripture explorer.
- `src/styles/` – Global, layout, and component styles.

## Adding More Passages
1. Create a new object in `src/data/scriptures.js` following the existing schema.
2. Add the passage’s `id` to any sections that should feature it (e.g., narrative timeline, hero highlights) within `src/scripts/index.js`.
3. The new passage automatically appears in the Scripture Spotlights grid and becomes available through `scripture.html?id=your-id`.

## Future Enhancements
- Add search and filtering for quick navigation through passages.
- Integrate audio narration for each study.
- Provide downloadable study guides and group discussion prompts.

Contributions are welcome! Please review the plan document for guiding principles before submitting updates.
