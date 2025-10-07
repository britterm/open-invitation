import {
  getScriptureById,
  getRelatedScriptures,
  buildContextHtml,
  buildFocusOnlyHtml,
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
        <h2>Going Deeper</h2>
        <p class="tension-question">${escapeHtml(scripture.tensionResolution.question)}</p>
        <p class="tension-steelman">${escapeHtml(scripture.tensionResolution.steelman)}</p>
        <p class="tension-response">${escapeHtml(scripture.tensionResolution.response)}</p>
        ${supportsHtml}
      </section>
    `
    : "";

  const hasContext = Array.isArray(scripture.context) && scripture.context.length > 0;
  const focusContextHtml = hasContext ? buildFocusOnlyHtml(scripture.context, scripture.reference) : "";
  const fullContextHtml = hasContext ? buildContextHtml(scripture.context) : "";

  scriptureBody.innerHTML = `
    <h1><img src="src/img/bible.jpg" alt="Bible" width="30px"> ${scripture.reference}<h1>
    <h2>${scripture.title}</h2>
    <p class="text-muted">${scripture.summary}</p>
    <div class="context-block">${buildContextHtml(scripture.context)}</div>
    <div class="badge" style="float: right; margin-top: .25rem">${scripture.translation}</div>
    ${buildAnalysisHtml(scripture.analysis)}
    ${tensionHtml}
    <br>
    <span role="img" aria-label="thinking face">🤔</span> <i>What thread of curiosity has this passage given you? Keep pulling on it and see where it leads!</i>
  `;

  if (hasContext) {
    const contextBlock = scriptureBody.querySelector(".context-block");
    if (contextBlock) {
      contextBlock.classList.add("context-section");
      const contextExtraId = `context-extra-${scripture.id}`;
      contextBlock.innerHTML = `
        <div class="context-header">
          <h2>Passage Context</h2>
          <button class="context-toggle" type="button" aria-expanded="false">
            <svg class="context-toggle__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M12 15.5 5 8.5l1.4-1.4L12 12.7l5.6-5.6L19 8.5z"></path>
            </svg>
            <span class="toggle-label show-label">Show surrounding verses</span>
            <span class="toggle-label hide-label">Hide surrounding verses</span>
          </button>
        </div>
        <div class="context-focus">
          ${focusContextHtml}
        </div>
        <div class="context-extra" data-context-extra hidden>
          ${fullContextHtml}
        </div>
      `;

      const contextToggle = contextBlock.querySelector(".context-toggle");
      const contextExtra = contextBlock.querySelector("[data-context-extra]");
      const contextFocus = contextBlock.querySelector(".context-focus");

      if (contextToggle && contextExtra && contextFocus) {
        contextExtra.id = contextExtraId;
        contextToggle.setAttribute("aria-controls", contextExtraId);

        const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        let prefersReducedMotion = reduceMotionQuery ? reduceMotionQuery.matches : false;

        const updateMotionPreference = (event) => {
          prefersReducedMotion = event.matches;
        };

        if (reduceMotionQuery) {
          if (typeof reduceMotionQuery.addEventListener === "function") {
            reduceMotionQuery.addEventListener("change", updateMotionPreference);
          } else if (typeof reduceMotionQuery.addListener === "function") {
            reduceMotionQuery.addListener(updateMotionPreference);
          }
        }

        const openExtra = () => {
          contextToggle.setAttribute("aria-expanded", "true");
          contextToggle.classList.add("is-active");
          contextFocus.hidden = true;
          contextExtra.hidden = false;
          contextExtra.classList.add("is-visible");
          if (prefersReducedMotion) {
            contextExtra.style.maxHeight = "none";
            return;
          }
          contextExtra.style.maxHeight = "0px";
          requestAnimationFrame(() => {
            contextExtra.style.maxHeight = `${contextExtra.scrollHeight}px`;
          });
        };

        const closeExtra = () => {
          contextToggle.setAttribute("aria-expanded", "false");
          contextToggle.classList.remove("is-active");
          if (prefersReducedMotion) {
            contextExtra.hidden = true;
            contextExtra.classList.remove("is-visible");
            contextExtra.style.maxHeight = "";
            contextFocus.hidden = false;
            return;
          }
          contextExtra.classList.remove("is-visible");
          const currentHeight = contextExtra.scrollHeight;
          contextExtra.style.maxHeight = `${currentHeight}px`;
          requestAnimationFrame(() => {
            contextExtra.style.maxHeight = "0px";
          });
        };

        contextToggle.addEventListener("click", () => {
          const expanded = contextToggle.getAttribute("aria-expanded") === "true";
          if (expanded) {
            closeExtra();
          } else {
            openExtra();
          }
        });

        if (!prefersReducedMotion) {
          contextExtra.addEventListener("transitionend", (event) => {
            if (event.propertyName !== "max-height") {
              return;
            }
            const expanded = contextToggle.getAttribute("aria-expanded") === "true";
            if (expanded) {
              contextExtra.style.maxHeight = "none";
            } else {
              contextExtra.hidden = true;
              contextExtra.style.maxHeight = "";
              contextFocus.hidden = false;
            }
          });
        }
      }
    }
  }

  const sidebarBackLink = document.querySelector(".section-inner > .back-link");
  if (sidebarBackLink) {
    sidebarBackLink.addEventListener("click", (event) => {
      const referrer = document.referrer;
      let canGoBack = false;
      if (referrer) {
        try {
          const refUrl = new URL(referrer, window.location.href);
          const sameOrigin = refUrl.origin === window.location.origin;
          const refPath = refUrl.pathname.endsWith("/") || refUrl.pathname.endsWith("index.html");
          canGoBack = sameOrigin && refPath;
        } catch (error) {
          canGoBack = false;
        }
      }
      if (canGoBack && window.history.length > 1) {
        event.preventDefault();
        window.history.back();
      }
    });
  }

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
