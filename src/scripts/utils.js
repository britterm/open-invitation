import scriptures from '../data/scriptures.js';

export function getScriptureById(id) {
  return scriptures.find((entry) => entry.id === id);
}

export function getFeaturedScriptures(ids) {
  return scriptures.filter((entry) => ids.includes(entry.id));
}

export function getRelatedScriptures(currentId, themes = [], limit = 4) {
  const matches = scriptures
    .filter((entry) => entry.id !== currentId)
    .map((entry) => {
      const overlap = entry.themes.filter((theme) => themes.includes(theme)).length;
      return { entry, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap || a.entry.reference.localeCompare(b.entry.reference));

  return matches
    .filter(({ overlap }) => overlap > 0)
    .slice(0, limit)
    .map(({ entry }) => entry);
}

export function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  if (options.classes) {
    element.className = Array.isArray(options.classes) ? options.classes.join(' ') : options.classes;
  }
  if (options.html) {
    element.innerHTML = options.html;
  }
  if (options.text) {
    element.textContent = options.text;
  }
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  return element;
}

export function formatThemes(themes) {
  return themes.map((theme) => `<span class="chip">${theme}</span>`).join('');
}

export function buildContextHtml(context) {
  return context
    .map(({ heading, text }) => {
      const headingHtml = heading ? `<strong>${heading}</strong>` : '';
      return `<p>${headingHtml}${heading ? '<br>' : ''}${text}</p>`;
    })
    .join('');
}

export function buildAnalysisHtml(analysis) {
  return analysis
    .map(({ title, body }) => {
      return `
        <div class="analysis-section">
          <h3>${title}</h3>
          <p>${body}</p>
        </div>
      `;
    })
    .join('');
}

export default scriptures;
