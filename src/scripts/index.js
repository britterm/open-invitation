import scriptures, {
  getScriptureById,
  getFeaturedScriptures,
  createElement,
  formatThemes,
} from "./utils.js";

const heroHighlightIds = [
  "isaiah-55-1-3",
  "john-20-30-31",
  "ephesians-1-13-14",
];
const narrativeSections = [
  {
    title: "A Call to Listen",
    description:
      "From the prophets onward, God pleads with His people to incline their ear. The invitation is open, the covenant is relational, and responsibility is real.",
    scriptureId: "deuteronomy-30-11-20",
    image: "src/img/listen.png",
    imageAlt:
      "Sunrise light casting across open fields and a narrow path forward",
    accent: "#4f46e5",
  },
  {
    title: "Prophets Summon Repentance",
    description:
      "Jeremiah and Ezekiel call the people to turn back, assuring them that the Lord takes no pleasure in death but delights when the wicked repent and live.",
    scriptureId: "ezekiel-18-30-32",
    image: "src/img/prophets.png",
    imageAlt: "Ancient stone gate with warm light shining through the opening",
    accent: "#f97316",
  },
  {
    title: "Messiah Announces Good News",
    description:
      "Jesus proclaims life to all who believe, promising new birth through trust in His name. Hearing produces belief, and belief receives life.",
    scriptureId: "john-20-30-31",
    image: "src/img/jesus.png",
    imageAlt: "Hands open in praise among a crowd lit by warm light",
    accent: "#ec4899",
  },
  {
    title: "Apostles Preach for Faith",
    description:
      "From Pentecost to Philippi, the Spirit moves as the word is proclaimed. Hearts are cut, households rejoice, and the Spirit falls when the message is heard.",
    scriptureId: "acts-2-37-38",
    image: "src/img/spirit.png",
    imageAlt:
      "Lantern light glowing over a gathered group in a stone courtyard",
    accent: "#22d3ee",
  },
  {
    title: "Hearing, Believing, Sealed",
    description:
      "Paul anchors assurance in the moment we hear the gospel, believe, and are sealed with the promised Spirit-no secret regeneration required beforehand.",
    scriptureId: "ephesians-1-13-14",
    image: "src/img/promise.png",
    imageAlt:
      "Close-up of hands holding an illuminated scroll in warm candlelight",
    accent: "#8b5cf6",
  },
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
  const card = createElement("article", { classes });
  card.style.setProperty("--stagger", `${index * 80}ms`);

  const categoryInfo = categoryMeta[entry.selectorCategory] ?? {
    label: entry.selectorCategory,
  };
  const translationTitle = `Translation: ${entry.translation}`;

  const tensionTooltip =
    entry.alignment === "tension" && entry.tensionResolution
      ? entry.tensionResolution.question
      : "Explores a debated interpretation";

  const tensionNote =
    entry.alignment === "tension"
      ? '<p class="tension-note">Alternate interpretation addressed in the full study.</p>'
      : "";

  const tensionIcon =
    entry.alignment === "tension"
      ? `<span class="tension-icon" aria-label="Explores a debated interpretation" title="${escapeAttribute(tensionTooltip)}">!</span>`
      : "";

  card.innerHTML = `

    <div class="card-head">

      <div class="badge" title="${escapeAttribute(translationTitle)}">${entry.reference}</div>

      ${tensionIcon}

    </div>

    <h3>${entry.summary}</h3>

    <p class="card-key-verse">${entry.keyVerse}</p>

    <div class="tag-group">${formatThemes(entry.themes)}</div>

    ${tensionNote}

    <div class="card-footer">
      <span class="category-label">${categoryInfo.label}</span>
      <a class="back-link" href="scripture.html?id=${entry.id}">Study this passage &rarr;</a>
    </div>
  `;

  requestAnimationFrame(() => {
    card.classList.add("is-active");
  });

  return card;
}
function populateSpotlightGrid(entries) {
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
    )
    .sort((a, b) => a.reference.localeCompare(b.reference));

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
renderHeroHighlights();
renderTimeline();
renderSpotlights();
initScrollReveal();
