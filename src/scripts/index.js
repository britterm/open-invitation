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
  },
  {
    title: 'Prophets Summon Repentance',
    description:
      'Jeremiah and Ezekiel call the people to turn back, assuring them that the Lord takes no pleasure in death but delights when the wicked repent and live.',
    scriptureId: 'ezekiel-18-30-32',
  },
  {
    title: 'Messiah Announces Good News',
    description:
      'Jesus proclaims life to all who believe, promising new birth through trust in His name. Hearing produces belief, and belief receives life.',
    scriptureId: 'john-20-30-31',
  },
  {
    title: 'Apostles Preach for Faith',
    description:
      'From Pentecost to Philippi, the Spirit moves as the word is proclaimed. Hearts are cut, households rejoice, and the Spirit falls when the message is heard.',
    scriptureId: 'acts-2-37-38',
  },
  {
    title: 'Hearing, Believing, Sealed',
    description:
      'Paul anchors assurance in the moment we hear the gospel, believe, and are sealed with the promised Spirit—no secret regeneration required beforehand.',
    scriptureId: 'ephesians-1-13-14',
  },
];

const spotlightContainer = document.querySelector('#spotlight-grid');
const heroGrid = document.querySelector('#hero-grid');
const timeline = document.querySelector('#timeline');

function renderHeroHighlights() {
  const highlights = getFeaturedScriptures(heroHighlightIds);
  highlights.forEach((entry, index) => {
    const card = createElement('div', { classes: ['glass-card', 'fade-in'] });
    card.style.animationDelay = `${index * 0.15}s`;
    card.innerHTML = `
      <div class="badge">${entry.reference}</div>
      <h3>${entry.summary}</h3>
      <p>${entry.keyVerse}</p>
      <a href="scripture.html?id=${entry.id}">Read the full study →</a>
    `;
    heroGrid.appendChild(card);
  });
}

function renderTimeline() {
  narrativeSections.forEach((section) => {
    const passage = getScriptureById(section.scriptureId);
    const item = createElement('div', { classes: 'timeline-item' });
    const bullet = createElement('div', { classes: 'timeline-bullet' });
    const content = createElement('div', { classes: 'story-card' });
    const title = createElement('h3', { text: section.title });
    const description = createElement('p', { text: section.description });
    const link = createElement('a', {
      html: `Explore ${passage.reference} →`,
      attrs: { href: `scripture.html?id=${passage.id}` },
      classes: 'text-muted',
    });

    content.append(title, description, link);
    item.append(bullet, content);
    timeline.appendChild(item);
  });
}

function renderSpotlights() {
  scriptures.forEach((entry) => {
    const card = createElement('article', { classes: 'card' });
    card.innerHTML = `
      <div class="badge">${entry.reference} · ${entry.translation}</div>
      <h3>${entry.summary}</h3>
      <p>${entry.keyVerse}</p>
      <div class="tag-group">${formatThemes(entry.themes)}</div>
      <a class="back-link" href="scripture.html?id=${entry.id}">Study this passage →</a>
    `;
    spotlightContainer.appendChild(card);
  });
}

renderHeroHighlights();
renderTimeline();
renderSpotlights();
