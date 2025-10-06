const state = {
  hero: null,
  heroTiles: [],
  narratives: [],
  scriptures: [],
  selectedScriptureId: null,
};

const heroForm = document.querySelector('#hero-form');
const heroRefreshBtn = document.querySelector('[data-action="refresh-hero"]');
const heroTilesForm = document.querySelector('#hero-tiles-form');
const heroTileSelects = Array.from(heroTilesForm.querySelectorAll('select'));
const narrativesList = document.querySelector('#narratives-list');
const narrativeDialog = document.querySelector('#narrative-dialog');
const narrativeForm = document.querySelector('#narrative-form');
const deleteNarrativeBtn = narrativeForm.querySelector('[data-action="delete-narrative"]');
const addNarrativeBtn = document.querySelector('[data-action="add-narrative"]');
const scriptureList = document.querySelector('#scripture-list');
const scriptureSearch = document.querySelector('#scripture-search');
const scriptureForm = document.querySelector('#scripture-form');
const scriptureEmpty = document.querySelector('#scripture-empty');
const addScriptureBtn = document.querySelector('[data-action="add-scripture"]');
const deleteScriptureBtn = scriptureForm.querySelector('[data-action="delete-scripture"]');
const duplicateScriptureBtn = scriptureForm.querySelector('[data-action="duplicate-scripture"]');
const scriptureFormTitle = document.querySelector('#scripture-form-title');
const scriptureIdList = document.querySelector('#scripture-id-list');
const flashRegion = document.querySelector('#flash-region');
const headerToggle = document.querySelector('[data-action="toggle-header"]');
const analysisList = document.querySelector('#analysis-list');
const addAnalysisBtn = document.querySelector('[data-action="add-analysis"]');

async function init() {
  bindHeaderToggle();
  bindHeroForm();
  bindHeroTilesForm();
  bindNarratives();
  bindScriptures();
  bindAnalysisEditor();
  await loadInitialData();
}

function bindHeaderToggle() {
  if (!headerToggle) return;
  headerToggle.addEventListener('click', () => {
    document.body.classList.toggle('header-collapsed');
    const collapsed = document.body.classList.contains('header-collapsed');
    headerToggle.textContent = collapsed ? 'Expand Header' : 'Collapse Header';
    headerToggle.setAttribute('aria-expanded', String(!collapsed));
  });
}

async function loadInitialData() {
  await Promise.all([loadHero(), loadScriptures()]);
  await Promise.all([loadHeroTiles(), loadNarratives()]);
}

async function loadHero() {
  const result = await fetchJson('/api/hero');
  state.hero = result;
  fillHeroForm(result);
}

function fillHeroForm(hero) {
  heroForm.title.value = hero?.title ?? '';
  heroForm.description.value = hero?.description ?? '';
  heroForm.imagePath.value = hero?.imagePath ?? '';
  heroForm.imageAlt.value = hero?.imageAlt ?? '';
  heroForm['primaryCta.label'].value = hero?.primaryCta?.label ?? '';
  heroForm['primaryCta.href'].value = hero?.primaryCta?.href ?? '';
  heroForm['secondaryCta.label'].value = hero?.secondaryCta?.label ?? '';
  heroForm['secondaryCta.href'].value = hero?.secondaryCta?.href ?? '';
}

function bindHeroForm() {
  heroForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(heroForm);
    const payload = {
      title: formData.get('title')?.trim() ?? '',
      description: formData.get('description')?.trim() ?? '',
      imagePath: formData.get('imagePath')?.trim() ?? '',
      imageAlt: formData.get('imageAlt')?.trim() ?? '',
      primaryCta: {
        label: formData.get('primaryCta.label')?.trim() ?? '',
        href: formData.get('primaryCta.href')?.trim() ?? '',
      },
      secondaryCta: {
        label: formData.get('secondaryCta.label')?.trim() ?? '',
        href: formData.get('secondaryCta.href')?.trim() ?? '',
      },
    };

    try {
      const result = await fetchJson('/api/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      state.hero = result;
      flash('Hero saved');
    } catch (error) {
      flash(error.message || 'Failed to save hero', { type: 'error' });
    }
  });

  heroRefreshBtn?.addEventListener('click', () => {
    loadHero().catch((error) => flash(error.message, { type: 'error' }));
  });
}

async function loadScriptures() {
  const result = await fetchJson('/api/scriptures');
  state.scriptures = result;
  renderScriptureList();
  populateHeroTileOptions();
  populateScriptureIdList();
}

function populateScriptureIdList() {
  scriptureIdList.innerHTML = '';
  state.scriptures.forEach((entry) => {
    const option = document.createElement('option');
    const label = `${entry.reference} — ${entry.title ?? ''}`.trim();
    option.value = entry.id;
    option.textContent = label;
    option.label = label;
    scriptureIdList.appendChild(option);
  });
}

async function loadHeroTiles() {
  const result = await fetchJson('/api/hero-tiles');
  state.heroTiles = result;
  heroTileSelects.forEach((select) => {
    const position = Number(select.name.split('-')[1]);
    const tile = result.find((entry) => entry.position === position);
    select.value = tile?.scriptureId ?? '';
  });
}

function populateHeroTileOptions() {
  const options = state.scriptures.map((entry) => {
    const option = document.createElement('option');
    const parts = [entry.reference, entry.title ?? ''].filter(Boolean);
    option.value = entry.id;
    option.textContent = parts.join(' — ');
    return option;
  });

  heroTileSelects.forEach((select) => {
    const current = select.value;
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a scripture';
    select.appendChild(placeholder);
    options.forEach((option) => select.appendChild(option.cloneNode(true)));
    if (current) {
      select.value = current;
    }
  });
}

function bindHeroTilesForm() {
  heroTilesForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const tiles = heroTileSelects.map((select, index) => ({
      position: index,
      scriptureId: select.value,
    }));
    try {
      const result = await fetchJson('/api/hero-tiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tiles),
      });
      state.heroTiles = result;
      flash('Hero tiles updated');
    } catch (error) {
      flash(error.message || 'Failed to update hero tiles', { type: 'error' });
    }
  });
}

async function loadNarratives() {
  const result = await fetchJson('/api/narratives');
  state.narratives = result;
  renderNarratives();
}

function renderNarratives() {
  narrativesList.innerHTML = '';
  state.narratives.forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${escapeHtml(entry.title)}</h3>
      <p class="meta">Scripture: ${escapeHtml(entry.scriptureId ?? '—')} · Position: ${entry.position ?? 0}</p>
      <p>${escapeHtml(entry.description)}</p>
      <footer>
        <button type="button" class="secondary" data-id="${entry.id}">Edit</button>
      </footer>
    `;
    card.querySelector('button').addEventListener('click', () => openNarrativeDialog(entry.id));
    narrativesList.appendChild(card);
  });
}

function bindNarratives() {
  addNarrativeBtn?.addEventListener('click', () => openNarrativeDialog());

  narrativeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(narrativeForm);
    const payload = {
      title: formData.get('title')?.trim() ?? '',
      description: formData.get('description')?.trim() ?? '',
      scriptureId: emptyToNull(formData.get('scriptureId')),
      imagePath: emptyToNull(formData.get('imagePath')),
      imageAlt: emptyToNull(formData.get('imageAlt')),
      accent: emptyToNull(formData.get('accent')),
      position: formData.get('position') ? Number(formData.get('position')) : null,
    };
    const id = formData.get('id');

    try {
      if (id) {
        await fetchJson(`/api/narratives/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        flash('Narrative updated');
      } else {
        await fetchJson('/api/narratives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        flash('Narrative created');
      }
      await loadNarratives();
      narrativeDialog.close();
    } catch (error) {
      flash(error.message || 'Failed to save narrative', { type: 'error' });
    }
  });

  deleteNarrativeBtn.addEventListener('click', async () => {
    const id = narrativeForm.elements.id.value;
    if (!id) {
      narrativeDialog.close();
      return;
    }
    if (!confirm('Delete this narrative section?')) return;
    try {
      await fetchJson(`/api/narratives/${id}`, { method: 'DELETE' });
      flash('Narrative deleted');
      await loadNarratives();
      narrativeDialog.close();
    } catch (error) {
      flash(error.message || 'Failed to delete narrative', { type: 'error' });
    }
  });
}

function openNarrativeDialog(id) {
  const narrative = id ? state.narratives.find((entry) => entry.id === id) : null;
  narrativeForm.reset();
  narrativeForm.elements.id.value = narrative?.id ?? '';
  narrativeForm.elements.title.value = narrative?.title ?? '';
  narrativeForm.elements.description.value = narrative?.description ?? '';
  narrativeForm.elements.scriptureId.value = narrative?.scriptureId ?? '';
  narrativeForm.elements.imagePath.value = narrative?.imagePath ?? '';
  narrativeForm.elements.imageAlt.value = narrative?.imageAlt ?? '';
  narrativeForm.elements.accent.value = narrative?.accent ?? '';
  narrativeForm.elements.position.value = narrative?.position ?? '';
  deleteNarrativeBtn.hidden = !narrative;
  if (typeof narrativeDialog.showModal === 'function') {
    narrativeDialog.showModal();
  } else {
    narrativeDialog.setAttribute('open', 'true');
  }
}

function bindScriptures() {
  scriptureSearch.addEventListener('input', renderScriptureList);

  addScriptureBtn?.addEventListener('click', () => {
    state.selectedScriptureId = null;
    scriptureForm.reset();
    renderAnalysisSections([]);
    scriptureForm.hidden = false;
    scriptureEmpty.hidden = true;
    scriptureFormTitle.textContent = 'New Scripture';
    deleteScriptureBtn.hidden = true;
    duplicateScriptureBtn.hidden = true;
    scriptureForm.elements.id.readOnly = false;
    scriptureForm.elements.id.value = '';
    scriptureForm.elements.id.focus();
  });

  scriptureList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    await openScripture(button.dataset.id);
  });

  scriptureForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = buildScripturePayload();
    const isUpdate = Boolean(state.selectedScriptureId);
    const url = isUpdate ? `/api/scriptures/${state.selectedScriptureId}` : '/api/scriptures';
    const method = isUpdate ? 'PUT' : 'POST';
    try {
      const result = await fetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      flash(`Scripture ${isUpdate ? 'updated' : 'created'}`);
      await loadScriptures();
      await openScripture(result.id);
    } catch (error) {
      flash(error.message || 'Failed to save scripture', { type: 'error' });
    }
  });

  deleteScriptureBtn.addEventListener('click', async () => {
    if (!state.selectedScriptureId) return;
    if (!confirm('Delete this scripture entry?')) return;
    try {
      await fetchJson(`/api/scriptures/${state.selectedScriptureId}`, { method: 'DELETE' });
      flash('Scripture deleted');
      state.selectedScriptureId = null;
      scriptureForm.hidden = true;
      scriptureEmpty.hidden = false;
      await loadScriptures();
    } catch (error) {
      flash(error.message || 'Failed to delete scripture', { type: 'error' });
    }
  });

  duplicateScriptureBtn.addEventListener('click', async () => {
    if (!state.selectedScriptureId) return;
    const data = buildScripturePayload();
    data.id = `${data.id}-copy`;
    try {
      const result = await fetchJson('/api/scriptures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      flash('Scripture duplicated');
      await loadScriptures();
      await openScripture(result.id);
    } catch (error) {
      flash(error.message || 'Failed to duplicate scripture', { type: 'error' });
    }
  });
}

function bindAnalysisEditor() {
  addAnalysisBtn?.addEventListener('click', () => {
    const card = addAnalysisSection({ title: '', body: '' });
    const titleInput = card.querySelector('[data-role="analysis-title"]');
    titleInput?.focus();
  });

  analysisList?.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-action="remove-analysis"]');
    if (!removeButton) return;
    const card = removeButton.closest('.analysis-item');
    if (!card) return;
    card.remove();
    if (analysisList.children.length === 0) {
      addAnalysisSection({ title: '', body: '' });
    }
  });

  analysisList?.addEventListener('input', (event) => {
    if (!event.target.matches('[data-role="analysis-body"], [data-role="analysis-title"]')) {
      return;
    }
    const card = event.target.closest('.analysis-item');
    if (!card) return;
    updateAnalysisPreview(card);
    syncAnalysisHeading(card);
  });
}

async function openScripture(id) {
  try {
    const result = await fetchJson(`/api/scriptures/${id}`);
    state.selectedScriptureId = id;
    fillScriptureForm(result);
    highlightActiveScripture();
  } catch (error) {
    flash(error.message || 'Failed to load scripture', { type: 'error' });
  }
}

function fillScriptureForm(entry) {
  scriptureForm.hidden = false;
  scriptureEmpty.hidden = true;
  scriptureFormTitle.textContent = entry.reference;
  scriptureForm.elements.id.value = entry.id;
  scriptureForm.elements.id.readOnly = true;
  scriptureForm.elements.reference.value = entry.reference ?? '';
  scriptureForm.elements.title.value = entry.title ?? '';
  scriptureForm.elements.translation.value = entry.translation ?? '';
  scriptureForm.elements.summary.value = entry.summary ?? '';
  scriptureForm.elements.keyVerse.value = entry.keyVerse ?? '';
  scriptureForm.elements.category.value = entry.category ?? '';
  scriptureForm.elements.selectorCategory.value = entry.selectorCategory ?? '';
  scriptureForm.elements.alignment.value = entry.alignment ?? '';
  scriptureForm.elements.themes.value = (entry.themes ?? []).join('\n');
  scriptureForm.elements.context.value = formatContextTextarea(entry.context ?? []);
  renderAnalysisSections(entry.analysis ?? []);
  scriptureForm.elements.badges.value = formatBadgesTextarea(entry.badges ?? []);
  deleteScriptureBtn.hidden = false;
  duplicateScriptureBtn.hidden = false;
}

function highlightActiveScripture() {
  const buttons = scriptureList.querySelectorAll('button[data-id]');
  buttons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.id === state.selectedScriptureId);
  });
}

function renderScriptureList() {
  const query = scriptureSearch.value?.toLowerCase().trim() ?? '';
  scriptureList.innerHTML = '';
  state.scriptures
    .filter((entry) => {
      if (!query) return true;
      return [entry.reference, entry.title, entry.id]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    })
    .forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.id = entry.id;
      button.innerHTML = `<strong>${escapeHtml(entry.reference)}</strong><br /><span>${escapeHtml(entry.title ?? '')}</span>`;
      if (entry.id === state.selectedScriptureId) {
        button.classList.add('is-active');
      }
      scriptureList.appendChild(button);
    });
}

function buildScripturePayload() {
  const formData = new FormData(scriptureForm);
  const context = parseDelimitedEntries(formData.get('context'));
  const analysis = collectAnalysisSections();

  return {
    id: formData.get('id')?.trim(),
    reference: formData.get('reference')?.trim(),
    title: formData.get('title')?.trim(),
    translation: formData.get('translation')?.trim(),
    summary: formData.get('summary')?.trim(),
    keyVerse: formData.get('keyVerse')?.trim(),
    category: emptyToNull(formData.get('category')),
    selectorCategory: emptyToNull(formData.get('selectorCategory')),
    alignment: emptyToNull(formData.get('alignment')),
    themes: splitLines(formData.get('themes')),
    context: context.map(({ heading, body }, index) => ({
      heading,
      text: body,
      position: index,
    })),
    analysis: analysis.map((entry, index) => ({
      title: entry.title,
      body: entry.body,
      position: index,
    })),
    badges: splitLines(formData.get('badges')).map((label, index) => ({
      label,
      position: index,
    })),
  };
}

function parseDelimitedEntries(value) {
  const lines = splitLines(value);
  return lines.map((line) => {
    const [heading, ...rest] = line.split('::');
    const body = rest.join('::').trim();
    return {
      heading: heading?.trim() ?? '',
      body,
    };
  });
}

function renderAnalysisSections(sections) {
  analysisList.innerHTML = '';
  if (!Array.isArray(sections) || sections.length === 0) {
    addAnalysisSection({ title: '', body: '' });
    return;
  }
  sections.forEach((section) => addAnalysisSection(section));
}

function addAnalysisSection(section) {
  const card = document.createElement('article');
  card.className = 'analysis-item repeatable-card';
  const titleText = section.title ?? '';
  const bodyText = section.body ?? '';
  card.innerHTML = `
    <header>
      <h4>${escapeHtml(titleText || 'Analysis Section')}</h4>
      <button type="button" class="remove-analysis" data-action="remove-analysis">Remove</button>
    </header>
    <label class="wide">
      <span>Title</span>
      <input type="text" name="analysis-title" data-role="analysis-title" value="${escapeHtml(titleText)}" />
    </label>
    <label class="wide">
      <span>Body (HTML allowed)</span>
      <textarea name="analysis-body" rows="4" data-role="analysis-body">${bodyText}</textarea>
    </label>
    <div class="analysis-preview" data-role="analysis-preview" aria-live="polite"></div>
  `;
  analysisList.appendChild(card);
  updateAnalysisPreview(card);
  syncAnalysisHeading(card);
  return card;
}

function collectAnalysisSections() {
  const cards = Array.from(analysisList.querySelectorAll('.analysis-item'));
  return cards
    .map((card) => {
      const titleInput = card.querySelector('[data-role="analysis-title"]');
      const bodyInput = card.querySelector('[data-role="analysis-body"]');
      const title = titleInput?.value?.trim() ?? '';
      const body = bodyInput?.value?.trim() ?? '';
      if (!title && !body) {
        return null;
      }
      return { title, body };
    })
    .filter(Boolean);
}

function updateAnalysisPreview(card) {
  const titleInput = card.querySelector('[data-role="analysis-title"]');
  const bodyInput = card.querySelector('[data-role="analysis-body"]');
  const preview = card.querySelector('[data-role="analysis-preview"]');
  if (!preview) return;
  const title = titleInput?.value?.trim() ?? '';
  const body = bodyInput?.value?.trim() ?? '';

  if (!title && !body) {
    preview.innerHTML = '<p class="preview-placeholder">Preview updates as you type.</p>';
    return;
  }

  const titleMarkup = title ? `<h3>${escapeHtml(title)}</h3>` : '';
  const bodyMarkup = body || '<p class="preview-placeholder">Add section body content.</p>';
  preview.innerHTML = `${titleMarkup}${bodyMarkup}`;
}

function syncAnalysisHeading(card) {
  const heading = card.querySelector('header h4');
  const titleInput = card.querySelector('[data-role="analysis-title"]');
  if (!heading || !titleInput) return;
  const title = titleInput.value.trim();
  heading.textContent = title || 'Analysis Section';
}

function formatContextTextarea(entries) {
  return entries
    .map((entry) => `${entry.heading ?? ''} :: ${entry.text ?? ''}`.trim())
    .join('\n');
}

function formatBadgesTextarea(entries) {
  return entries
    .map((entry) => (typeof entry === 'string' ? entry : entry.label))
    .filter(Boolean)
    .join('\n');
}

function splitLines(value) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function emptyToNull(value) {
  const text = value?.trim();
  return text ? text : null;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const payload = JSON.parse(text);
      message = payload.error || payload.message || text;
    } catch (_) {
      // ignore
    }
    throw new Error(message || `${response.status} ${response.statusText}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function escapeHtml(value) {
  return (value ?? '').replace(/[&<>"']/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char] ?? char;
  });
}

function flash(message, { type = 'success', timeout = 3200 } = {}) {
  const div = document.createElement('div');
  div.className = `flash${type === 'error' ? ' error' : ''}`;
  div.textContent = message;
  flashRegion.appendChild(div);
  setTimeout(() => {
    div.remove();
  }, timeout);
}

init().catch((error) => {
  console.error(error);
  flash('Failed to initialise editor', { type: 'error' });
});
