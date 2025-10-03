# Project Plan: Open Invitation Scripture Explorer

## Vision and Goals
- Present a welcoming, engaging experience that invites visitors to explore Scripture from a dynamic omniscience, non-Calvinist perspective.
- Emphasize that faith comes through hearing the Word, not through pre-regeneration, by highlighting relevant passages and analysis.
- Provide easily extendable content structures so new passages, commentary, and media can be added without reworking core layouts.

## Audience and Tone
- Primary audience: Christians curious about the Ordo Salutis debate, especially those questioning deterministic frameworks.
- Tone: Warm, narrative-driven, hopeful, and rooted in Scripture. Visuals should feel uplifting and exploratory.

## Information Architecture
1. **Landing Page (`index.html`)**
   - Hero section introducing the "Open Invitation" theme.
   - Narrative timeline illustrating God's redemptive plan from creation to the present, focused on responsive relationship rather than determinism.
   - Scripture spotlights embedded within the narrative, linking to deeper studies.
   - Call-to-action blocks guiding visitors to explore Scripture studies, subscribe for updates, or participate in community discussions (future feature placeholder).
2. **Scripture Explorer Page (`scripture.html`)**
   - Displays selected passage with surrounding context, highlighting the focal verses.
   - Provides structured commentary: textual observations, theological reflections, and application points.
   - Sidebar for related passages, thematic tags, and navigation between studies.
3. **Shared Components**
   - Persistent header/footer with brand identity and navigation.
   - Data-driven rendering using a shared `scriptures.js` dataset.

## Content Model
Each scripture entry will include:
- `id`: unique slug used in URLs.
- `reference`: human-readable reference (e.g., "Romans 10:17").
- `translation`: translation label (e.g., "ESV").
- `focus`: verses that are emphasized.
- `context`: extended passage text for context.
- `keyVerse`: the exact focus verse text.
- `theme`: tags like "Faith", "Hearing", "Responsibility", "Call".
- `summary`: high-level takeaway for landing-page cards.
- `analysis`: array of commentary sections (title + body) to present in the explorer.
- `links`: additional resources (optional for future expansion).

## Initial Scripture Set (20 Passages)
1. Romans 10:17
2. Romans 10:14-15
3. John 20:30-31
4. Acts 2:37-38
5. Acts 10:43-48
6. Acts 13:46-48
7. Acts 16:30-34
8. Hebrews 4:2
9. Hebrews 11:6
10. Galatians 3:2-5
11. Ephesians 1:13-14
12. James 1:18-21
13. 1 Peter 1:22-25
14. Revelation 3:20
15. Isaiah 55:1-3
16. Jeremiah 7:23-28
17. Ezekiel 18:30-32
18. Deuteronomy 30:11-20
19. 2 Corinthians 5:18-21
20. 1 Timothy 2:3-6

These passages will either be woven into the landing-page narrative or linked through callouts and the explorer sidebar.

## Visual and Interaction Design
- **Color Palette**: Warm gradients (sunrise hues), deep navy accents, light neutrals for readability.
- **Typography**: Friendly sans-serif for UI, serif for scripture text to provide reverence and contrast.
- **Imagery**: Abstract shapes, subtle textures reminiscent of illuminated manuscripts; no heavy photography to maintain focus on text.
- **Animations**: Soft fade-ins and scroll-triggered reveals for narrative sections (initial implementation via CSS transitions; future enhancement via Intersection Observer).

## Technical Approach
- Static HTML/CSS/JS for portability and simplicity.
- Central data file `src/data/scriptures.js` exporting an array of passage objects.
- Landing page script (`src/scripts/index.js`) dynamically injects featured passages into narrative callouts.
- Scripture explorer script (`src/scripts/scripture.js`) reads query parameters (`?id=`) to load matching data and render context/analysis.
- Utility functions for formatting and navigation located in `src/scripts/utils.js` for reuse.
- Styles split into global (`src/styles/global.css`), layout (`src/styles/layout.css`), and component-specific modules (`src/styles/components.css`).

## Extensibility Strategy
- New passages can be appended to `scriptures.js` with minimal friction.
- Narrative sections reference scriptures by ID; future updates only require dataset changes, not markup rewrites.
- Analysis sections stored as arrays allow adding multiple commentary points without altering templates.
- Placeholder components for upcoming features (newsletter, discussion prompts) are documented for later activation.

## Implementation Roadmap
1. **Phase 1 (Current)**
   - Establish project structure and base styles.
   - Implement landing page with narrative sections and scripture callouts.
   - Build scripture explorer page with context highlighting and commentary layout.
   - Populate initial 20 scripture entries with summarized analysis.
2. **Phase 2**
   - Add client-side routing enhancements or SPA framework if needed.
   - Integrate search/filtering for passages.
   - Add multimedia elements (audio readings, timeline illustrations).
3. **Phase 3**
   - Implement user engagement features (newsletter signup, community testimonies).
   - Incorporate backend or CMS for collaborative content updates.

## Documentation and Maintenance
- Update README with project overview, setup instructions, and contribution guidelines.
- Maintain changelog for future iterations.
- Encourage theological review by trusted advisors before publishing new commentary.

