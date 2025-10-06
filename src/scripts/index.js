import scriptures, {
  getScriptureById,
  getFeaturedScriptures,
  createElement,
  formatThemes,
  getMagnifyIcon,
} from "./utils.js";
import narrativeSections from "../data/narratives.js";
import { featureFlags } from "./featureFlags.js";

const heroHighlightIds = [
  "isaiah-55-1-3",
  "john-20-30-31",
  "ephesians-1-13-14",
];

const ALL_CATEGORY_KEY = "All";

const categoryMeta = {
  [ALL_CATEGORY_KEY]: {
    label: "All",
    description: "Browse every passage across all focus areas together.",
  },
  "Invitation & Hearing": {
    label: "Invitation & Hearing",
    description: "How proclamation meets listening hearts and sparks faith.",
  },
  "Response & Mission": {
    label: "Response & Mission",
    description:
      "Where messengers partner with God and hearers make real choices.",
  },
  "Spirit & New Life": {
    label: "Spirit & New Life",
    description:
      "How the Spirit seals, renews, and empowers those who believe.",
  },
  "Accountability & Perseverance": {
    label: "Accountability & Perseverance",
    description:
      "Warnings and assurances that call believers to stay responsive to grace.",
  },
};

const categoryKeys = Object.keys(categoryMeta);
let currentCategory = ALL_CATEGORY_KEY;

const spotlightContainer = document.querySelector("#spotlight-grid");
const categoryChips = document.querySelector("#category-chips");
const categoryDescription = document.querySelector("#category-description");
const heroGrid = document.querySelector("#hero-grid");
const timeline = document.querySelector("#timeline");

const conciseSpotlightsEnabled =
  featureFlags && featureFlags.conciseSpotlights === true;

const spotlightHint = document.querySelector("#spotlight-concise-hint");
if (spotlightHint) {
  spotlightHint.hidden = !conciseSpotlightsEnabled;
}

let spotlightTooltip;

function ensureSpotlightTooltip() {
  if (!conciseSpotlightsEnabled || spotlightTooltip) return;
  spotlightTooltip = createElement('div', { classes: 'spotlight-tooltip' });
  spotlightTooltip.setAttribute('aria-hidden', 'true');
  spotlightTooltip.setAttribute('role', 'status');
  spotlightTooltip.setAttribute('aria-live', 'polite');
  document.body.appendChild(spotlightTooltip);
  window.addEventListener(
    'scroll',
    () => {
      hideSpotlightTooltip();
    },
    { passive: true }
  );
}

function showSpotlightTooltip(text) {
  if (!conciseSpotlightsEnabled) return;
  ensureSpotlightTooltip();
  if (!spotlightTooltip) return;
  spotlightTooltip.textContent = text;
  spotlightTooltip.setAttribute('aria-hidden', 'false');
  spotlightTooltip.classList.add('is-visible');
}

function hideSpotlightTooltip() {
  if (!spotlightTooltip) return;
  spotlightTooltip.classList.remove('is-visible');
  spotlightTooltip.setAttribute('aria-hidden', 'true');
}

if (conciseSpotlightsEnabled) {
  ensureSpotlightTooltip();
}


const CARD_LEAVE_DURATION = 320;

function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function renderHeroHighlights() {
  const highlights = getFeaturedScriptures(heroHighlightIds);
  highlights.forEach((entry, index) => {
    const card = createElement("a", {
      classes: ["glass-card", "fade-in", "hero-link"],
      attrs: {
        href: `scripture.html?id=${entry.id}`,
        "aria-label": `Read the full study for ${entry.reference}`,
      },
    });
    card.style.animationDelay = `${index * 0.15}s`;
    card.innerHTML = `
      <div class="badge">${entry.reference}</div>
      <h3>${entry.summary}</h3>
      <p>${entry.keyVerse}</p>
      <span class="text-link">Read the full study &rarr;</span>
    `;
    heroGrid.appendChild(card);
  });
}

function renderTimeline() {
  narrativeSections.forEach((section, index) => {
    const passage = getScriptureById(section.scriptureId);
    const item = createElement("div", {
      classes: ["timeline-item"],
    });
    item.style.setProperty(
      "--accent",
      section.accent || "var(--color-primary)",
    );
    item.style.setProperty("--reveal-delay", `${index * 120}ms`);
    const bullet = createElement("div", { classes: "timeline-bullet" });
    const content = createElement("article", { classes: "story-card" });
    content.style.setProperty(
      "--accent",
      section.accent || "var(--color-secondary)",
    );
    content.innerHTML = `
      <div class="story-media">
        <img src="${section.image}" alt="${section.imageAlt}" loading="lazy" />
        <span class="story-media-glow"></span>
      </div>
      <div class="story-content">
        <span class="story-pill">${passage.reference}</span>
        <h3>${section.title}</h3>
        <p>${section.description}</p>
        <a class="story-link" href="scripture.html?id=${passage.id}">Explore ${passage.reference} &rarr;</a>
      </div>
    `;

    item.append(bullet, content);
    timeline.appendChild(item);
  });
}

function initScrollReveal() {
  const items = document.querySelectorAll(".timeline-item");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 },
  );

  items.forEach((item) => observer.observe(item));
}

function updateCategoryDescription() {
  if (!categoryDescription) return;
  const info = categoryMeta[currentCategory];
  categoryDescription.textContent = info ? info.description : "";
}

function renderCategoryChips() {
  if (!categoryChips) return;
  categoryChips.innerHTML = "";
  categoryKeys.forEach((category) => {
    const meta = categoryMeta[category] ?? { label: category };
    const isActive = category === currentCategory;
    const classes = ["category-chip"];
    if (isActive) classes.push("is-active");
    const button = createElement("button", {
      classes,
      text: meta.label,
      attrs: {
        type: "button",
        "data-category": category,
        "aria-pressed": isActive ? "true" : "false",
      },
    });

    button.addEventListener("click", () => {
      if (currentCategory === category) return;
      currentCategory = category;
      renderCategoryChips();
      renderSpotlightCards();
    });

    categoryChips.appendChild(button);
  });

  updateCategoryDescription();
}
function createSpotlightCard(entry, index) {
  const classes = ["card", "filter-card"];
  if (entry.alignment === "tension") {
    classes.push("card-tension");
  }
  if (conciseSpotlightsEnabled) {
    classes.push("spotlight-card--concise");
  }
  const card = createElement("article", { classes });
  card.style.setProperty("--stagger", `${index * 80}ms`);

  const categoryInfo = categoryMeta[entry.selectorCategory] ?? {
    label: entry.selectorCategory,
  };
  const translationTitle = `Translation: ${entry.translation}`;

  const tensionTooltip =
    entry.alignment === "tension" && entry.tensionResolution
      ? entry.tensionResolution.question
      : "Take a closer look at the surrounding context.";

  const tensionNote =
    entry.alignment === "tension"
      ? '<p class="tension-note">Alternate interpretation addressed in the full study.</p>'
      : "";

  const tensionIcon =
    entry.alignment === "tension"
      ? `<span class="tension-icon" aria-label="Invites a closer look at the passage context" title="${escapeAttribute(tensionTooltip)}">
          <magnify-icon></magnify-icon>
        </span>`
      : "";

  const headingContent = conciseSpotlightsEnabled ? entry.reference : entry.summary;
  const summaryId = `spotlight-summary-${entry.id}`;
  const summaryMarkup = conciseSpotlightsEnabled
    ? `<p id="${summaryId}" class="visually-hidden card-summary">${entry.summary}</p>`
    : "";

  card.innerHTML = `
    <a href="scripture.html?id=${entry.id}">
    <div class="card-head">

      <div class="badge" title="${escapeAttribute(translationTitle)}">${entry.reference}</div>

      ${tensionIcon}

    </div>

    <h3>${headingContent}</h3>

    <p class="card-key-verse">${entry.keyVerse}</p>

    <div class="tag-group">${formatThemes(entry.themes)}</div>

    ${tensionNote}

    ${summaryMarkup}

    <div class="card-footer">
      <span class="category-label">${categoryInfo.label}</span>
      Study this passage &rarr;
    </div>
    </a>
  `;

  if (conciseSpotlightsEnabled) {
    card.dataset.summary = entry.summary;
    card.addEventListener("mouseenter", () => showSpotlightTooltip(entry.summary));
    card.addEventListener("mouseleave", hideSpotlightTooltip);
  }

  const studyLink = card.querySelector(".back-link");
  if (studyLink && conciseSpotlightsEnabled) {
    studyLink.setAttribute("aria-describedby", summaryId);
    studyLink.addEventListener("focus", () => showSpotlightTooltip(entry.summary));
    studyLink.addEventListener("blur", hideSpotlightTooltip);
  }

  requestAnimationFrame(() => {
    card.classList.add("is-active");
  });

  return card;
}

function populateSpotlightGrid(entries) {
  if (conciseSpotlightsEnabled) {
    hideSpotlightTooltip();
  }
  if (!spotlightContainer) return;
  spotlightContainer.innerHTML = "";

  if (entries.length === 0) {
    const emptyState = createElement("p", {
      classes: "empty-state",
      text: "No passages are available in this category yet.",
    });
    spotlightContainer.appendChild(emptyState);
    return;
  }

  entries.forEach((entry, index) => {
    const card = createSpotlightCard(entry, index);
    spotlightContainer.appendChild(card);
  });
}

function renderSpotlightCards() {
  if (!spotlightContainer) return;
  const entries = scriptures
    .filter((entry) =>
      currentCategory === ALL_CATEGORY_KEY
        ? true
        : entry.selectorCategory === currentCategory,
    );
  // .sort((a, b) => a.reference.localeCompare(b.reference));

  const currentCards = Array.from(
    spotlightContainer.querySelectorAll(".filter-card"),
  );
  if (currentCards.length) {
    currentCards.forEach((card) => card.classList.remove("is-active"));
    setTimeout(() => populateSpotlightGrid(entries), CARD_LEAVE_DURATION);
    return;
  }

  populateSpotlightGrid(entries);
}

function renderSpotlights() {
  renderCategoryChips();
  renderSpotlightCards();
}

// Define custom element for magnify icon
class MagnifyIcon extends HTMLElement {
  connectedCallback() {
    this.innerHTML = getMagnifyIcon();
    this.style.display = 'inline-flex';
    this.style.verticalAlign = 'middle';
    this.style.width = '1rem';
    this.style.height = '1rem';
    const svg = this.querySelector('svg');
    if (svg) {
      svg.style.width = '100%';
      svg.style.height = '100%';
    }
  }
}
customElements.define('magnify-icon', MagnifyIcon);

renderHeroHighlights();
renderTimeline();
renderSpotlights();
initScrollReveal();
