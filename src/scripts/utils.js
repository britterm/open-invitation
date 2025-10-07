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

export function buildFocusOnlyHtml(context = [], defaultHeading = '') {
  if (!Array.isArray(context) || context.length === 0) {
    return '';
  }

  const focusEntries = context.filter((item = {}) => {
    const { text = '' } = item;
    return typeof text === 'string' && text.includes('<span class="focus-text">');
  });

  const preview = focusEntries.length ? focusEntries : [context[0]];

  return preview
    .map(({ heading, text }) => {
      const normalizedHeading = defaultHeading || heading || '';
      const headingHtml = normalizedHeading ? `<strong>${normalizedHeading}</strong>` : '';
      if (!text) {
        return headingHtml ? `<p>${headingHtml}${normalizedHeading ? '<br>' : ''}</p>` : '';
      }
      const focusMatches = [...text.matchAll(/<span class="focus-text">([\s\S]*?)<\/span>/g)];
      const focusHtml = focusMatches.length
        ? focusMatches.map(match => `<span class="focus-text">${match[1]}</span>`).join(' ... ')
        : text;
      return `<p>${headingHtml}${normalizedHeading ? '<br>' : ''}${focusHtml}</p>`;
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

export function getMagnifyIcon() {
  return `<svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
    <path
      fill='currentColor'
      d='M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z'
    />
  </svg>`;
}

export default scriptures;
