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
const scriptureDialog = document.querySelector('#scripture-dialog');
const scriptureForm = document.querySelector('#scripture-form');
const addScriptureBtn = document.querySelector('[data-action="add-scripture"]');
const deleteScriptureBtn = document.querySelector('[data-action="delete-scripture"]');
const duplicateScriptureBtn = document.querySelector('[data-action="duplicate-scripture"]');
const closeDialogBtn = document.querySelector('[data-action="close-dialog"]');
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
    const label = `${entry.reference}  -  ${entry.title ?? ''}`.trim();
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
    option.textContent = parts.join('  -  ');
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
      <p class="meta">Scripture: ${escapeHtml(entry.scriptureId ?? ' - ')} · Position: ${entry.position ?? 0}</p>
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

  // Bind collapsible sections
  scriptureDialog.querySelectorAll('.toggle-section').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const section = btn.closest('.collapsible-section');
      toggleSection(section);
    });
  });

  scriptureDialog.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.collapsible-section');
      toggleSection(section);
    });
  });

  addScriptureBtn?.addEventListener('click', () => {
    state.selectedScriptureId = null;
    scriptureForm.reset();
    renderAnalysisSections([]);
    scriptureFormTitle.textContent = 'New Scripture';
    deleteScriptureBtn.hidden = true;
    duplicateScriptureBtn.hidden = true;
    scriptureForm.elements.id.readOnly = false;
    scriptureForm.elements.id.value = '';
    
    // Expand all sections
    scriptureDialog.querySelectorAll('.collapsible-section').forEach(section => {
      section.classList.remove('collapsed');
      updateToggleButton(section);
    });
    
    if (typeof scriptureDialog.showModal === 'function') {
      scriptureDialog.showModal();
    } else {
      scriptureDialog.setAttribute('open', 'true');
    }
    scriptureForm.elements.id.focus();
  });

  scriptureList.addEventListener('click', async (event) => {
    const card = event.target.closest('.scripture-card');
    if (!card) return;
    await openScripture(card.dataset.id);
  });

  closeDialogBtn?.addEventListener('click', () => {
    scriptureDialog.close();
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
      scriptureDialog.close();
    } catch (error) {
      flash(error.message || 'Failed to save scripture', { type: 'error' });
    }
  });

  deleteScriptureBtn.addEventListener('click', async () => {
    if (!state.selectedScriptureId) return;
    if (!confirm('Are you sure you want to delete this scripture? This action cannot be undone.')) return;
    try {
      await fetchJson(`/api/scriptures/${state.selectedScriptureId}`, { method: 'DELETE' });
      flash('Scripture deleted');
      state.selectedScriptureId = null;
      scriptureDialog.close();
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

function toggleSection(section) {
  const isCollapsed = section.classList.toggle('collapsed');
  updateToggleButton(section);
  
  if (isCollapsed) {
    updateSectionPreview(section);
  }
}

function updateToggleButton(section) {
  const btn = section.querySelector('.toggle-section');
  const isCollapsed = section.classList.contains('collapsed');
  btn.textContent = isCollapsed ? 'Expand' : 'Collapse';
}

function updateSectionPreview(section) {
  const sectionName = section.dataset.section;
  const preview = section.querySelector('.section-preview');
  
  if (!preview) return;
  
  let content = '';
  
  switch (sectionName) {
    case 'metadata':
      const ref = scriptureForm.elements.reference.value;
      const title = scriptureForm.elements.title.value;
      const category = scriptureForm.elements.category.value;
      const themes = scriptureForm.elements.themes.value.split('\n').filter(Boolean);
      content = `
        <p><strong>${escapeHtml(ref)}</strong> - ${escapeHtml(title)}</p>
        ${category ? `<p>Category: ${escapeHtml(category)}</p>` : ''}
        ${themes.length ? `<p>Themes: ${themes.map(escapeHtml).join(', ')}</p>` : ''}
      `;
      break;
    case 'summaries':
      const summary = scriptureForm.elements.summary.value;
      const keyVerse = scriptureForm.elements.keyVerse.value;
      content = `
        ${summary ? `<p><strong>Summary:</strong> ${escapeHtml(summary)}</p>` : ''}
        ${keyVerse ? `<p><strong>Key Verse:</strong> <em>${escapeHtml(keyVerse)}</em></p>` : ''}
      `;
      break;
    case 'context':
      const contextText = scriptureForm.elements.context.value;
      const contexts = parseDelimitedEntries(contextText);
      content = contexts.map(c => `<p><strong>${escapeHtml(c.heading || '')}</strong><br>${escapeHtml(c.text || '')}</p>`).join('');
      break;
    case 'analysis':
      const analysisSections = collectAnalysisSections();
      content = analysisSections.map(a => `<p><strong>${escapeHtml(a.title)}</strong><br>${escapeHtml(a.body.substring(0, 100))}...</p>`).join('');
      break;
  }
  
  preview.innerHTML = content || '<p style="color: #94a3b8; font-style: italic;">No content</p>';
}

function bindAnalysisEditor() {
  addAnalysisBtn?.addEventListener('click', () => {
    const card = addAnalysisSection({ title: '', body: '' });
    const titleInput = card.querySelector('[data-role="analysis-title"]');
    titleInput?.focus();
  });

  analysisList?.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-action="remove-analysis"]');
    if (removeButton) {
      const card = removeButton.closest('.analysis-item');
      if (!card) return;
      card.remove();
      if (analysisList.children.length === 0) {
        addAnalysisSection({ title: '', body: '' });
      }
      return;
    }

    const toggleButton = event.target.closest('[data-action="toggle-analysis"]');
    if (toggleButton) {
      const card = toggleButton.closest('.analysis-item');
      if (!card) return;
      toggleAnalysisItem(card);
      return;
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
    
    // Expand all sections when opening
    scriptureDialog.querySelectorAll('.collapsible-section').forEach(section => {
      section.classList.remove('collapsed');
      updateToggleButton(section);
    });
    
    if (typeof scriptureDialog.showModal === 'function') {
      scriptureDialog.showModal();
    } else {
      scriptureDialog.setAttribute('open', 'true');
    }
  } catch (error) {
    flash(error.message || 'Failed to load scripture', { type: 'error' });
  }
}

function fillScriptureForm(entry) {
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

const canonicalBooks = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
  '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
];
const canonicalIndex = new Map(canonicalBooks.map((b, i) => [b, i]));

function parseReference(ref) {
  const m = ref && ref.match(/^([1-3]?\s?[A-Za-z ]+?)\s+(\d+):(\d+)/);
  if (!m) {
    return { book: ref || '', chapter: Number.MAX_SAFE_INTEGER, verse: Number.MAX_SAFE_INTEGER };
  }
  const book = m[1].trim();
  const chapter = parseInt(m[2], 10) || 0;
  const verse = parseInt(m[3], 10) || 0;
  return { book, chapter, verse };
}

function compareByCanonical(a, b) {
  const pa = parseReference(a.reference);
  const pb = parseReference(b.reference);
  const ia = canonicalIndex.has(pa.book) ? canonicalIndex.get(pa.book) : Number.MAX_SAFE_INTEGER;
  const ib = canonicalIndex.has(pb.book) ? canonicalIndex.get(pb.book) : Number.MAX_SAFE_INTEGER;
  if (ia !== ib) return ia - ib;
  if (pa.chapter !== pb.chapter) return pa.chapter - pb.chapter;
  if (pa.verse !== pb.verse) return pa.verse - pb.verse;
  return (a.id || '').localeCompare(b.id || '');
}

function renderScriptureList() {
  const query = scriptureSearch.value?.toLowerCase().trim() ?? '';
  scriptureList.innerHTML = '';
  state.scriptures
    .filter((entry) => {
      if (!query) return true;
      return [entry.reference, entry.title, entry.id, entry.summary]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    })
    .sort(compareByCanonical)
    .forEach((entry) => {
      const card = document.createElement('div');
      card.className = 'scripture-card';
      card.dataset.id = entry.id;
      
      let cardHtml = `
        <span class="reference">${escapeHtml(entry.reference)}</span>
        <h3>${escapeHtml(entry.title ?? '')}</h3>
      `;
      
      if (entry.summary) {
        cardHtml += `<p class="summary">${escapeHtml(entry.summary)}</p>`;
      }
      
      if (entry.keyVerse) {
        cardHtml += `<p class="key-verse">${escapeHtml(entry.keyVerse)}</p>`;
      }
      
      card.innerHTML = cardHtml;
      scriptureList.appendChild(card);
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
    <header class="analysis-item-header">
      <h4>${escapeHtml(titleText || 'Analysis Section')}</h4>
      <div class="analysis-item-actions">
        <button type="button" class="toggle-analysis secondary" data-action="toggle-analysis">Collapse</button>
        <button type="button" class="remove-analysis" data-action="remove-analysis">Remove</button>
      </div>
    </header>
    <div class="analysis-item-content">
      <label class="wide">
        <span>Title</span>
        <input type="text" name="analysis-title" data-role="analysis-title" value="${escapeHtml(titleText)}" />
      </label>
      <label class="wide">
        <span>Body (HTML allowed)</span>
        <textarea name="analysis-body" rows="4" data-role="analysis-body">${bodyText}</textarea>
      </label>
    </div>
    <div class="analysis-item-preview" data-role="analysis-preview"></div>
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

function toggleAnalysisItem(card) {
  const isCollapsed = card.classList.toggle('collapsed');
  const toggleBtn = card.querySelector('[data-action="toggle-analysis"]');
  const content = card.querySelector('.analysis-item-content');
  const preview = card.querySelector('[data-role="analysis-preview"]');
  
  if (toggleBtn) {
    toggleBtn.textContent = isCollapsed ? 'Expand' : 'Collapse';
  }
  
  if (content) {
    content.hidden = isCollapsed;
  }
  
  if (preview) {
    // Always update preview when toggling
    updateAnalysisPreview(card);
    // Preview is always visible (shown below content when expanded, or alone when collapsed)
    preview.hidden = false;
  }
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
