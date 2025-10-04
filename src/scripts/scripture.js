import {
  getScriptureById,
  getRelatedScriptures,
  buildContextHtml,
  buildAnalysisHtml,
  createElement,
  formatThemes,
} from "./utils.js";

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const scripture = id ? getScriptureById(id) : null;

const scriptureBody = document.querySelector("#scripture-body");
const sidebar = document.querySelector("#sidebar");

if (!scripture) {
  scriptureBody.innerHTML = `
    <h1>Passage not found</h1>
    <p>We couldn't find that study. Please return to the Scripture Spotlights and choose a passage.</p>
    <a class="back-link" href="index.html#spotlights">Back to all passages</a>
  `;
} else {
  document.title = `${scripture.reference} Study | Open Invitation`;

  const tensionSupports =
    scripture.tensionResolution &&
    Array.isArray(scripture.tensionResolution.supports)
      ? scripture.tensionResolution.supports
      : [];
  const supportsHtml = tensionSupports.length
    ? `<ul class="tension-points">${tensionSupports
        .map((point) => `<li>${escapeHtml(point)}</li>`)
        .join("")}</ul>`
    : "";
  const tensionHtml = scripture.tensionResolution
    ? `
      <section class="tension-study">
        <h2>Examining Alternate Interpretation</h2>
        <p class="tension-question">${escapeHtml(scripture.tensionResolution.question)}</p>
        <p class="tension-steelman"><strong>Steel man:</strong> ${escapeHtml(scripture.tensionResolution.steelman)}</p>
        <p class="tension-response"><strong>Placed in context:</strong> ${escapeHtml(scripture.tensionResolution.response)}</p>
        ${supportsHtml}
      </section>
    `
    : "";

  scriptureBody.innerHTML = `
    <div class="badge">${scripture.reference} - ${scripture.translation}</div>
    <h1>${scripture.title}</h1>
    <p class="text-muted">${scripture.summary}</p>
    <div class="context-block">${buildContextHtml(scripture.context)}</div>
    <div class="analysis-section">
      <h2>Exegetical Reflections</h2>
      ${buildAnalysisHtml(scripture.analysis)}
    </div>
    ${tensionHtml}
  `;

  const sidebarContent = createElement("div", { classes: "card" });
  sidebarContent.innerHTML = `
    <h3>Key Verse</h3>
    <p class="focus-text">${scripture.keyVerse}</p>
    <div class="tag-group" style="margin-top: 1rem;">${formatThemes(scripture.themes)}</div>
  `;

  const related = getRelatedScriptures(scripture.id, scripture.themes, 5);
  const relatedWrapper = createElement("div", { classes: "card" });
  relatedWrapper.innerHTML = "<h3>Related Studies</h3>";

  if (related.length === 0) {
    const empty = createElement("p", { text: "More studies coming soon." });
    relatedWrapper.appendChild(empty);
  } else {
    const list = createElement("div", { classes: "related-list" });
    related.forEach((entry) => {
      const item = createElement("div", {
        classes: "related-card",
        html: `
          <strong>${entry.reference}</strong>
          <p>${entry.summary}</p>
          <a class="back-link" href="scripture.html?id=${entry.id}">View study &rarr;</a>
        `,
      });
      list.appendChild(item);
    });
    relatedWrapper.appendChild(list);
  }

  sidebar.append(sidebarContent, relatedWrapper);
}
