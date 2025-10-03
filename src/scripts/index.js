import scriptures from '../data/scriptures.js';
import {
  getScriptureById,
  getFeaturedScriptures,
  createElement,
  formatThemes,
} from './utils.js';

const heroHighlightIds = ['isaiah-55-1-3', 'john-20-30-31', 'ephesians-1-13-14'];
const narrativeSections = [
  {
    title: 'A Call to Listen',
    description:
      'From the prophets onward, God pleads with His people to incline their ear. The invitation is open, the covenant is relational, and responsibility is real.',
    scriptureId: 'deuteronomy-30-11-20',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Sunrise light casting across open fields and a narrow path forward',
    accent: '#4f46e5',
  },
  {
    title: 'Prophets Summon Repentance',
    description:
      'Jeremiah and Ezekiel call the people to turn back, assuring them that the Lord takes no pleasure in death but delights when the wicked repent and live.',
    scriptureId: 'ezekiel-18-30-32',
    image:
      'https://images.unsplash.com/photo-1522148541350-5303e55e6b5d?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Ancient stone gate with warm light shining through the opening',
    accent: '#f97316',
  },
  {
    title: 'Messiah Announces Good News',
    description:
      'Jesus proclaims life to all who believe, promising new birth through trust in His name. Hearing produces belief, and belief receives life.',
    scriptureId: 'john-20-30-31',
    image:
      'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Hands open in praise among a crowd lit by warm light',
    accent: '#ec4899',
  },
  {
    title: 'Apostles Preach for Faith',
    description:
      'From Pentecost to Philippi, the Spirit moves as the word is proclaimed. Hearts are cut, households rejoice, and the Spirit falls when the message is heard.',
    scriptureId: 'acts-2-37-38',
    image:
      'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Lantern light glowing over a gathered group in a stone courtyard',
    accent: '#22d3ee',
  },
  {
    title: 'Hearing, Believing, Sealed',
    description:
      'Paul anchors assurance in the moment we hear the gospel, believe, and are sealed with the promised Spirit—no secret regeneration required beforehand.',
    scriptureId: 'ephesians-1-13-14',
    image:
      'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Close-up of hands holding an illuminated scroll in warm candlelight',
    accent: '#8b5cf6',
  },
];

const categoryDetails = [
  {
    label: 'Hear and Believe',
    description: 'Passages where hearing the proclaimed word becomes the spark for genuine belief.',
  },
  {
    label: 'Respond in Faith',
    description: 'Texts that invite hearers to repent, trust, and actively choose life in Christ.',
  },
  {
    label: 'Spirit & New Life',
    description: 'Moments showing the Spirit given through the heard word, bringing new birth and assurance.',
  },
  {
    label: 'Mission & Mediation',
    description: 'Witness-bearing passages where ambassadors partner with God to carry the invitation.',
  },
  {
    label: 'Accountability & Awakening',
    description: 'Warnings that reveal the responsibility that comes with receiving light and testimony.',
  },
];

const spotlightContainer = document.querySelector('#spotlight-grid');
const heroGrid = document.querySelector('#hero-grid');
const timeline = document.querySelector('#timeline');

function escapeAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function renderHeroHighlights() {
  const highlights = getFeaturedScriptures(heroHighlightIds);
  highlights.forEach((entry, index) => {
    const card = createElement('a', {
      classes: ['glass-card', 'fade-in', 'hero-link'],
      attrs: {
        href: `scripture.html?id=${entry.id}`,
        'aria-label': `Read the full study for ${entry.reference}`,
      },
    });
    card.style.animationDelay = `${index * 0.15}s`;
    card.innerHTML = `
      <div class="badge">${entry.reference}</div>
      <h3>${entry.summary}</h3>
      <p>${entry.keyVerse}</p>
      <span class="text-link">Read the full study →</span>
    `;
    heroGrid.appendChild(card);
  });
}

function renderTimeline() {
  narrativeSections.forEach((section, index) => {
    const passage = getScriptureById(section.scriptureId);
    const item = createElement('div', {
      classes: ['timeline-item'],
    });
    item.style.setProperty('--accent', section.accent || 'var(--color-primary)');
    item.style.setProperty('--reveal-delay', `${index * 120}ms`);
    const bullet = createElement('div', { classes: 'timeline-bullet' });
    const content = createElement('article', { classes: 'story-card' });
    content.style.setProperty('--accent', section.accent || 'var(--color-secondary)');
    content.innerHTML = `
      <div class="story-media">
        <img src="${section.image}" alt="${section.imageAlt}" loading="lazy" />
        <span class="story-media-glow"></span>
      </div>
      <div class="story-content">
        <span class="story-pill">${passage.reference}</span>
        <h3>${section.title}</h3>
        <p>${section.description}</p>
        <a class="story-link" href="scripture.html?id=${passage.id}">Explore ${passage.reference} →</a>
      </div>
    `;

    item.append(bullet, content);
    timeline.appendChild(item);
  });
}

function initScrollReveal() {
  const items = document.querySelectorAll('.timeline-item');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );

  items.forEach((item) => observer.observe(item));
}

function renderSpotlights() {
  const grouped = scriptures.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {});

  categoryDetails.forEach(({ label, description }) => {
    const entries = grouped[label];
    if (!entries || entries.length === 0) return;

    const section = createElement('section', { classes: 'category-group' });
    const header = createElement('div', { classes: 'category-header' });
    header.innerHTML = `
      <h3>${label}</h3>
      <p>${description}</p>
    `;

    const grid = createElement('div', { classes: ['grid', 'scripture-grid', 'category-grid'] });

    entries
      .sort((a, b) => a.reference.localeCompare(b.reference))
      .forEach((entry) => {
        const card = createElement('article', { classes: 'card' });
        const translationTitle = `Translation: ${entry.translation}`;
        card.innerHTML = `
          <div class="badge" title="${escapeAttribute(translationTitle)}">${entry.reference}</div>
          <h3>${entry.summary}</h3>
          <p>${entry.keyVerse}</p>
          <div class="tag-group">${formatThemes(entry.themes)}</div>
          <a class="back-link" href="scripture.html?id=${entry.id}">Study this passage →</a>
        `;
        grid.appendChild(card);
      });

    section.append(header, grid);
    spotlightContainer.appendChild(section);
  });
}

renderHeroHighlights();
renderTimeline();
renderSpotlights();
initScrollReveal();
