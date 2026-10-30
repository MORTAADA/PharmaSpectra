const DATA_URL = "data/molecules.json";
const SPECTRA = {
  uv_vis: { label: "UV-Visible", short: "UV", x: "Longueur d’onde (nm)", y: "Absorbance" },
  ir: { label: "IR", short: "IR", x: "Nombre d’onde (cm⁻¹)", y: "Transmittance (%)" },
  nmr_1h: { label: "RMN ¹H", short: "¹H", x: "Déplacement chimique (ppm)", y: "Intensité (u.a.)" },
  nmr_13c: { label: "RMN ¹³C", short: "¹³C", x: "Déplacement chimique (ppm)", y: "Intensité (u.a.)" }
};
let molecules = [];
let selectedId = null;
let activeSpectrum = "uv_vis";
let activeTab = "overview";
let sessionImports = {};

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[c]));

const APP_VERSION = "1.0.2";
// --- IndexedDB : catalogue + spectres importés persistants (hors ligne, rapide) ---
const DB_NAME = "pharmaspectra", DB_VERSION = 1;
const idb = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) return reject(new Error("IndexedDB indisponible"));
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("molecules")) db.createObjectStore("molecules", { keyPath: "id" });
        if (!db.objectStoreNames.contains("imports")) db.createObjectStore("imports", { keyPath: "key" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      };
      req.onsuccess = () => { this._db = req.result; resolve(this._db); };
      req.onerror = () => reject(req.error);
    });
  },
  async tx(store, mode, fn) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode), s = t.objectStore(store);
      const out = fn(s);
      t.oncomplete = () => resolve(out && "result" in out ? out.result : undefined);
      t.onerror = t.onabort = () => reject(t.error);
    });
  },
  getAll: (store) => idb.tx(store, "readonly", s => s.getAll()),
  get: (store, key) => idb.tx(store, "readonly", s => s.get(key)),
  put: (store, value) => idb.tx(store, "readwrite", s => s.put(value)),
  putMany: (store, values) => idb.tx(store, "readwrite", s => { values.forEach(v => s.put(v)); }),
  del: (store, key) => idb.tx(store, "readwrite", s => s.delete(key))
};
async function loadCatalog() {
  // Le JSON est la référence : on resynchronise IndexedDB à chaque nouvelle version des données.
  let fromJson = null;
  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    fromJson = await response.json();
  } catch (e) { console.warn("JSON indisponible, lecture du cache IndexedDB", e); }
  try {
    const meta = await idb.get("meta", "dataVersion");
    if (fromJson && (!meta || meta.value !== fromJson.dataVersion)) {
      await idb.putMany("molecules", fromJson.molecules);
      await idb.put("meta", { key: "dataVersion", value: fromJson.dataVersion });
    }
    const imports = await idb.getAll("imports");
    imports.forEach(({ key, ...spec }) => { sessionImports[key] = spec; });
    const cached = await idb.getAll("molecules");
    if (cached.length) {
      const order = (fromJson?.molecules || cached).map(m => m.id);
      return cached.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }
  } catch (e) { console.warn("IndexedDB non utilisé :", e); }
  if (fromJson) return fromJson.molecules || [];
  throw new Error("Aucune source de données");
}

async function init() {
  try {
    molecules = await loadCatalog();
    $("#countLabel").textContent = `${molecules.length} molécules dans le catalogue`;
    $("#sideCount").textContent = molecules.length;
    renderList();
    if (molecules.length) selectMolecule(molecules[0].id, { scroll: false });
  } catch (error) {
    $("#countLabel").textContent = "Chargement impossible";
    $("#moleculeList").innerHTML = `<p class="muted small">Impossible de lire data/molecules.json. Lancez le projet avec un serveur local (voir README.md), plutôt qu’en ouvrant directement index.html.</p>`;
    $("#detailPanel").innerHTML = `<div class="empty-state"><div class="empty-icon">!</div><h2>Les données ne se chargent pas</h2><p>Vérifiez que le dossier data/ existe et démarrez un serveur local.</p></div>`;
    console.error(error);
  }
}

function renderList(query = "") {
  const q = query.trim().toLocaleLowerCase("fr");
  const filtered = molecules.filter(m =>
    [m.name, ...(m.synonyms || []), m.formula, m.category, m.id]
      .filter(Boolean).some(v => String(v).toLocaleLowerCase("fr").includes(q))
  );
  $("#countLabel").textContent = q ? `${filtered.length} résultat(s) sur ${molecules.length}` : `${molecules.length} molécules dans le catalogue`;
  $("#moleculeList").innerHTML = filtered.length ? filtered.map(m => `
    <button class="molecule-item ${m.id === selectedId ? "active" : ""}" data-id="${escapeHTML(m.id)}">
      <span class="mol-avatar">${escapeHTML((m.name || "??").slice(0,2).toUpperCase())}</span>
      <span class="mol-label"><strong>${escapeHTML(m.name)}</strong><small>${escapeHTML(m.category || "Catégorie non renseignée")}</small></span>
    </button>`).join("") : `<p class="muted small">Aucun résultat. Essayez un autre nom.</p>`;
  $("#moleculeList").querySelectorAll("[data-id]").forEach(btn =>
    btn.addEventListener("click", () => selectMolecule(btn.dataset.id))
  );
}

function selectMolecule(id, options = {}) {
  selectedId = id;
  activeSpectrum = "uv_vis";
  const molecule = molecules.find(m => m.id === id);
  if (!molecule) return;
  renderList($("#searchInput").value);
  renderDetails(molecule);
  // Après un clic dans la liste, amener la fiche complète à l’écran :
  // identité, structure, composition et les quatre cartes de spectres.
  if (options.scroll !== false) {
    requestAnimationFrame(() => {
      $("#detailPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function valueOrMissing(value, suffix = "") {
  return value !== null && value !== undefined && value !== ""
    ? `${escapeHTML(value)}${suffix}`
    : `<span class="missing">Non renseigné</span>`;
}

function applyPhaseCorrection(realPoints, imaginaryPoints, phase0Degrees, phase1Degrees = 0) {
  const real = Array.isArray(realPoints) ? realPoints : [];
  const imaginary = Array.isArray(imaginaryPoints) ? imaginaryPoints : [];
  if (real.length !== imaginary.length) throw new Error('Les canaux R et I doivent contenir le même nombre de points pour la correction de phase.');
  const phase0 = Number(phase0Degrees), phase1 = Number(phase1Degrees);
  if (!Number.isFinite(phase0) || !Number.isFinite(phase1)) throw new Error('Angles de phase invalides.');
  const correctedReal = [], correctedImaginary = [];
  for (let i = 0; i < real.length; i++) {
    const r = Number(real[i]?.y), im = Number(imaginary[i]?.y);
    const xr = Number(real[i]?.x), xi = Number(imaginary[i]?.x);
    if (![r, im, xr, xi].every(Number.isFinite) || Math.abs(xr - xi) > 1e-8 * Math.max(1, Math.abs(xr), Math.abs(xi))) {
      throw new Error(`Canaux R/I non alignés ou non numériques au point ${i + 1}.`);
    }
    // PH1 représente ici la variation totale de phase entre les deux extrémités
    // de la série; le pivot est au centre de l'index des points.
    const fraction = real.length > 1 ? i / (real.length - 1) - 0.5 : 0;
    const phase = (phase0 + phase1 * fraction) * Math.PI / 180;
    const c = Math.cos(phase), si = Math.sin(phase);
    correctedReal.push({ x: xr, y: r * c - im * si });
    correctedImaginary.push({ x: xr, y: r * si + im * c });
  }
  return { real: correctedReal, imaginary: correctedImaginary };
}

function renderDetails(m) {
  const structure = m.structure_image_url
    ? `<img src="${escapeHTML(m.structure_image_url)}" alt="Structure chimique de ${escapeHTML(m.name)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="structure-fallback" hidden>Image indisponible<br><a href="${escapeHTML(m.chemical_data_source?.url || m.pubchem_search_url || 'https://pubchem.ncbi.nlm.nih.gov/')}" target="_blank" rel="noreferrer">Ouvrir la source</a></span>`
    : `<span class="structure-fallback">Structure chimique non intégrée</span>`;
  const spectrumCount = Object.values(m.spectra || {}).filter(spec => Array.isArray(spec?.points) && spec.points.length >= 2 && spec.source_url && spec.source_name).length;
  const property = (label, value, suffix = "") => `<div class="property"><span>${label}</span><strong>${valueOrMissing(value, suffix)}</strong></div>`;
  const spectrumKeys = Object.keys(SPECTRA);
  const cards = spectrumKeys.map(key => renderSpectrumCard(m, key)).join("");
  $('#detailPanel').innerHTML = `
    <div class="profile-header">
      <div class="drug-heading"><div class="drug-icon">◈<small>#${String(molecules.findIndex(x=>x.id===m.id)+1).padStart(2,'0')}</small></div><div><h2>${escapeHTML(m.name)}</h2><p>${escapeHTML(m.iupac_name || m.category || "Fiche moléculaire")}</p><span class="category-chip">${escapeHTML(m.category || "Médicament")}</span></div></div>
      <div class="profile-actions"><a class="btn light-btn" href="${escapeHTML(m.pubchem_search_url || "https://pubchem.ncbi.nlm.nih.gov/")}" target="_blank" rel="noreferrer">Voir sur PubChem ↗</a></div>
    </div>
    <nav class="tabs" role="tablist" aria-label="Sections de la fiche">${[["overview","Vue générale"],["spectra","Spectres"],["references","Références"],["files","Fichiers"]].map(([id,l])=>`<button type="button" role="tab" class="tab ${id===activeTab?"active":""}" data-tab="${id}" aria-selected="${id===activeTab}">${l}</button>`).join("")}</nav>
    <div class="chemistry-summary">
      <section class="chemistry-card structure-card"><h3 class="section-title">Structure chimique</h3><div class="structure-box structure-box-large">${structure}</div><a class="inline-link" href="${escapeHTML(m.chemical_data_source?.url || m.pubchem_search_url || "https://pubchem.ncbi.nlm.nih.gov/")}" target="_blank" rel="noreferrer">Consulter la structure ↗</a></section>
      <section class="chemistry-card composition-card"><h3 class="section-title">Composition chimique</h3><div class="property-list">${property("Formule moléculaire", m.formula)}${property("Masse molaire", m.molar_mass_g_mol, " g/mol")}${property("Numéro CAS", m.cas_number)}${property("Nom IUPAC", m.iupac_name)}</div>${m.chemical_data_source ? `<p class="citation">Source : <strong>${escapeHTML(m.chemical_data_source.name)}</strong></p>` : ""}</section>
    </div>
    <section id="spectraSection" class="spectra-section"><div class="spectra-head"><div><p class="eyebrow">ANALYSE SPECTRALE</p><h3 class="section-title">Spectres analytiques</h3></div><span class="pill">${spectrumCount} spectre(s) numérique(s) intégré(s)</span></div><div class="spectra-grid">${cards}</div><div class="warning">ⓘ Les spectres ne sont tracés que si des points numériques sont disponibles. Les listes de pics ne sont pas des spectres complets. Les imports locaux sont temporaires et doivent être vérifiés avant interprétation.</div></section>
    <div class="tab-pane pane-references">${renderSourceExplorer(m)}</div>
    <section class="tab-pane pane-files">${renderFilesPanel(m)}</section>`;
  $("#detailPanel").dataset.tab = activeTab;
  $("#detailPanel").querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => { activeTab = b.dataset.tab; renderDetails(m); }));
  for (const key of Object.keys(SPECTRA)) {
    const spec = sessionImports[`${m.id}:${key}`] || m.spectra?.[key];
    const node = document.querySelector(`#plot-${key}`);
    if (node && Array.isArray(spec?.points) && spec.points.length >= 2) {
      drawPlot(node, spec.points, SPECTRA[key].x, SPECTRA[key].y, key.startsWith('nmr') || key === 'ir');
      const channelButtons = node.parentElement?.querySelectorAll('[data-ntuples-channel]') || [];
      if (channelButtons.length && spec.jcamp_channels) {
        let phase0Degrees = 0;
        let phase1Degrees = 0;
        let currentMode = 'real';
        const getChannels = () => applyPhaseCorrection(spec.jcamp_channels.real, spec.jcamp_channels.imaginary, phase0Degrees, phase1Degrees);
        const renderChannel = (mode) => {
          currentMode = mode;
          const channels = Array.isArray(spec.jcamp_channels.real) && Array.isArray(spec.jcamp_channels.imaginary) ? getChannels() : spec.jcamp_channels;
          const selected = mode === 'real' ? channels.real : mode === 'imaginary' ? channels.imaginary : null;
          if (mode === 'both') drawMultiChannelPlot(node, channels.real, channels.imaginary, SPECTRA[key].x, SPECTRA[key].y, true);
          else drawPlot(node, selected || spec.points, SPECTRA[key].x, `${SPECTRA[key].y} — ${mode === 'real' ? 'canal réel R' : 'canal imaginaire I'}`, true);
          channelButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.ntuplesChannel === mode));
        };
        channelButtons.forEach(btn => btn.addEventListener('click', () => renderChannel(btn.dataset.ntuplesChannel)));
        const phase0Slider = document.querySelector(`#phase-${key}`);
        const phase0Output = document.querySelector(`#phase-value-${key}`);
        const phase1Slider = document.querySelector(`#phase1-${key}`);
        const phase1Output = document.querySelector(`#phase1-value-${key}`);
        if (phase0Slider && phase0Output && phase1Slider && phase1Output && Array.isArray(spec.jcamp_channels.real) && Array.isArray(spec.jcamp_channels.imaginary)) {
          const updatePhase = () => {
            phase0Degrees = Number(phase0Slider.value);
            phase1Degrees = Number(phase1Slider.value);
            phase0Output.value = `${phase0Degrees}°`; phase0Output.textContent = `${phase0Degrees}°`;
            phase1Output.value = `${phase1Degrees}°`; phase1Output.textContent = `${phase1Degrees}°`;
            renderChannel(currentMode);
          };
          phase0Slider.addEventListener('input', updatePhase);
          phase1Slider.addEventListener('input', updatePhase);
          const reset = document.querySelector(`[data-phase-reset="${key}"]`);
          reset?.addEventListener('click', () => {
            phase0Slider.value = '0'; phase1Slider.value = '0';
            phase0Degrees = 0; phase1Degrees = 0;
            phase0Output.value = '0°'; phase0Output.textContent = '0°';
            phase1Output.value = '0°'; phase1Output.textContent = '0°';
            renderChannel(currentMode);
          });
        }
        renderChannel('real');
      }
    }
    const peakNode = document.querySelector(`#peakplot-${key}`);
    if (peakNode && Array.isArray(spec?.peaks) && spec.peaks.length) {
      drawPeakPlot(peakNode, spec.peaks, SPECTRA[key].x);
    }
  }
}


function renderFilesPanel(m) {
  const rows = Object.entries(SPECTRA).map(([key, s]) => {
    const spec = sessionImports[`${m.id}:${key}`] || m.spectra?.[key] || {};
    const n = spec.points?.length || 0, p = spec.peaks?.length || 0;
    const state = n >= 2 ? `${n} points` : p ? `${p} pics publiés` : "Aucune donnée";
    const dl = spec.data_download_url ? `<a href="${escapeHTML(spec.data_download_url)}" target="_blank" rel="noreferrer">Télécharger ↗</a>` : "—";
    return `<tr><td>${s.label}</td><td>${escapeHTML(spec.data_file || "—")}</td><td>${state}</td><td>${dl}</td></tr>`;
  }).join("");
  return `<h3 class="section-title">Fichiers de données — ${escapeHTML(m.name)}</h3><table class="files-table"><thead><tr><th>Spectre</th><th>Fichier</th><th>État</th><th>Source de téléchargement</th></tr></thead><tbody>${rows}</tbody></table><p class="muted">Les spectres importés sont enregistrés dans IndexedDB (ce navigateur).</p><div class="files-actions"><button type="button" class="btn-ok" onclick="document.getElementById('spectrumFileInput').click()">⇧ Importer un fichier</button><button type="button" class="btn-cancel" onclick="exportIntegratedData()">Exporter JSON</button></div>`;
}

function renderSourceExplorer(m) {
  const q = encodeURIComponent(m.name || m.id || "");
  const nist = `https://webbook.nist.gov/cgi/cbook.cgi?Name=${q}`;
  const hmdb = `https://hmdb.ca/unearth/q?query=${q}&searcher=metabolites`;
  const sdbs = "https://sdbs.db.aist.go.jp/sdbs/cgi-bin/cre_index.cgi?lang=eng";
  const links = [
    ["PubChem", m.pubchem_search_url || `https://pubchem.ncbi.nlm.nih.gov/#query=${q}`, "Identité chimique et spectres associés"],
    ["NIST Chemistry WebBook", nist, "IR / UV-Visible selon disponibilité"],
    ["HMDB", hmdb, "Données RMN et fichiers de pics selon disponibilité"],
    ["SDBS (AIST, Japon)", sdbs, "IR, RMN ¹H et RMN ¹³C pour composés répertoriés"],
    ["SpectraBase", `https://spectrabase.com/`, "Catalogue multi-technique; accès variable"]
  ];
  // Liens de données spécifiques identifiés pendant la recherche documentaire.
  // Ils ouvrent les sources originales; ils ne signifient pas que le fichier est intégré localement.
  if (m.id === "aspirine") {
    links.unshift(["NIST — UV-Visible aspirine (JCAMP-DX)", "https://webbook.nist.gov/cgi/cbook.cgi?Index=0&JCAMP=C50782&Type=UVVis", "Téléchargement annoncé par NIST; fichier non intégré à cette archive"]);
  }
  if (m.id === "paracetamol") {
    links.unshift(
      ["HMDB — RMN ¹H expérimentale", "https://www.hmdb.ca/spectra/nmr_one_d/2079", "400 MHz, DMSO-d₆; CSV de pics annoncé, non intégré localement"],
      ["HMDB — RMN ¹³C expérimentale", "https://www.hmdb.ca/spectra/nmr_one_d/2773", "22,53 MHz, DMSO-d₆ selon l’audit existant; CSV annoncé, non intégré localement"],
      ["HMDB — RMN ¹H prédite (séparée)", "https://www.hmdb.ca/spectra/nmr_one_d/9708", "Données prédites en D₂O; ne pas confondre avec un spectre expérimental"]
    );
  }
  return `<section class="source-explorer"><div><p class="eyebrow">RECHERCHE DOCUMENTAIRE</p><h3 class="section-title">Autres sources à vérifier pour ${escapeHTML(m.name)}</h3><p>Ces liens ouvrent des catalogues externes. Ils ne signifient pas qu’un spectre de cette molécule est disponible, librement téléchargeable ou déjà intégré localement.</p></div><div class="source-explorer-grid">${links.map(([name,url,desc]) => `<a class="source-explorer-link" href="${escapeHTML(url)}" target="_blank" rel="noreferrer"><strong>${escapeHTML(name)} ↗</strong><span>${escapeHTML(desc)}</span></a>`).join("")}</div></section>`;
}

function renderSpectrumCard(m, key) {
  const spec = sessionImports[`${m.id}:${key}`] || m.spectra?.[key];
  const meta = SPECTRA[key];
  const hasPoints = Array.isArray(spec?.points) && spec.points.length >= 2;
  const hasPeaks = Array.isArray(spec?.peaks) && spec.peaks.length > 0;
  const hasSource = Boolean(spec?.source_url && spec?.source_name);
  const isUnverifiedImport = spec?.status === "session_imported" || spec?.status === "imported_needs_source_review";
  const hasSourceImage = Boolean(spec?.spectrum_image_url);
  const colorClass = key === "ir" ? "ir" : key === "nmr_1h" ? "nmr1" : key === "nmr_13c" ? "nmr13" : "uv";
  const source = isUnverifiedImport ? `<div class="spectrum-source"><span>Provenance à vérifier</span><strong>${escapeHTML(spec.source_name || "Fichier local importé")}</strong><small>${escapeHTML(spec.citation || "Fichier importé localement. La source, les unités et les conditions expérimentales ne sont pas encore validées.")}</small>${hasSource ? `<a href="${escapeHTML(spec.source_url)}" target="_blank" rel="noreferrer">Voir la référence ↗</a>` : ""}</div>` : hasSource ? `<div class="spectrum-source"><span>Source scientifique</span><strong>${escapeHTML(spec.source_name)}</strong>${spec.citation ? `<small>${escapeHTML(spec.citation)}</small>` : ""}<a href="${escapeHTML(spec.source_url)}" target="_blank" rel="noreferrer">Voir la référence ↗</a>${spec.data_download_url ? `<a href="${escapeHTML(spec.data_download_url)}" target="_blank" rel="noreferrer">${hasPeaks ? "Liste de pics source ↗" : "Données / téléchargement ↗"}</a>` : ""}</div>` : `<div class="spectrum-source"><span>Statut</span><strong>Référence à rechercher</strong><small>Aucune donnée vérifiée dans la base locale.</small><a href="https://sdbs.db.aist.go.jp/" target="_blank" rel="noreferrer">Rechercher dans SDBS ↗</a><a href="https://webbook.nist.gov/" target="_blank" rel="noreferrer">Explorer NIST ↗</a></div>`;
  let graph;
  const hasNtupleChannels = key.startsWith('nmr') && spec?.jcamp_channels && (Array.isArray(spec.jcamp_channels.real) || Array.isArray(spec.jcamp_channels.imaginary));
  if (hasPoints) {
    const hasBothNtupleChannels = Array.isArray(spec?.jcamp_channels?.real) && Array.isArray(spec?.jcamp_channels?.imaginary);
    const channelControls = hasNtupleChannels ? `<div class="ntuples-channel-controls" role="group" aria-label="Canal RMN à afficher"><button type="button" class="channel-btn active" data-ntuples-channel="real" ${Array.isArray(spec.jcamp_channels.real) ? '' : 'disabled'}>Réel (R)</button><button type="button" class="channel-btn" data-ntuples-channel="imaginary" ${Array.isArray(spec.jcamp_channels.imaginary) ? '' : 'disabled'}>Imaginaire (I)</button><button type="button" class="channel-btn" data-ntuples-channel="both" ${hasBothNtupleChannels ? '' : 'disabled'}>Comparer R + I</button></div>${hasBothNtupleChannels ? `<div class="phase-controls"><label for="phase-${key}">Phase zéro (PH0)</label><div class="phase-control-row"><input id="phase-${key}" type="range" min="-180" max="180" step="1" value="0"><output id="phase-value-${key}">0°</output></div><label for="phase1-${key}" class="phase1-label">Phase du premier ordre (PH1, variation totale)</label><div class="phase-control-row"><input id="phase1-${key}" type="range" min="-180" max="180" step="1" value="0"><output id="phase1-value-${key}">0°</output><button type="button" class="channel-btn" data-phase-reset="${key}">Réinitialiser</button></div></div>` : ''}<p class="peak-list-note">Les canaux R et I sont conservés séparément. PH0 est constant; PH1 varie linéairement entre les deux extrémités, avec pivot au centre des points. Correction d’aperçu uniquement : les données originales ne sont jamais modifiées.</p>` : '';
    graph = `<div class="plot-wrap">${channelControls}<div class="plot-container" id="plot-${key}"></div>${isUnverifiedImport ? `<p class="peak-list-note">Données importées, mais source, unités et conditions non vérifiées : ne pas encore utiliser pour une interprétation scientifique.</p>` : ""}</div>`;
  } else if (hasPeaks && hasSource) {
    const rows = spec.peaks.map((p, i) => `<tr><td>${i + 1}</td><td>${Number(p.shift_ppm).toFixed(2)}</td><td>${Number(p.intensity).toFixed(2)}</td></tr>`).join("");
    graph = `<div class="peak-data-wrap"><div class="plot-container peak-plot" id="peakplot-${key}"></div><p class="peak-list-note">Diagramme de bâtons construit à partir des valeurs de pics publiées — aucune interpolation entre les pics.</p><details><summary>Voir la liste des valeurs (${spec.peaks.length})</summary><div class="peak-table-scroll"><table class="peak-table"><thead><tr><th>#</th><th>Déplacement (ppm)</th><th>Intensité publiée</th></tr></thead><tbody>${rows}</tbody></table></div></details></div>`;
  } else if (hasSourceImage) {
    graph = `<div class="source-spectrum-image"><a href="${escapeHTML(spec.spectrum_image_url)}" target="_blank" rel="noreferrer"><img src="${escapeHTML(spec.spectrum_image_url)}" alt="Spectre de référence ${escapeHTML(meta.label)} provenant de ${escapeHTML(spec.source_name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>Image NIST non chargée dans ce navigateur. <a href="${escapeHTML(spec.source_url)}" target="_blank" rel="noreferrer">Ouvrir le spectre sur NIST</a></span></a><p>${escapeHTML(spec.image_note || "Image de référence externe; les points numériques ne sont pas intégrés localement.")}</p></div>`;
  } else {
    graph = `<div class="empty-plot"><div class="empty-plot-icon">${key.startsWith("nmr") ? "∿" : key === "ir" ? "〰" : "◉"}</div><strong>Aucune donnée numérique intégrée</strong><span>Les données vérifiées apparaîtront après import.</span></div>`;
  }
  const status = isUnverifiedImport ? "Import à vérifier" : hasPoints ? "Données numériques sourcées" : hasPeaks ? "Pics publiés — tracés" : hasSourceImage ? "Image de référence" : "Données à intégrer";
  const card = `<article class="spectrum-card ${colorClass}"><header class="spectrum-card-head"><span class="spectrum-icon">${key === "ir" ? "∿" : key === "nmr_1h" ? "⚗" : key === "nmr_13c" ? "⚗" : "◉"}</span><div class="spectrum-card-title"><h4>${meta.label === "IR" ? "Spectre IR (Infrarouge)" : meta.label}</h4><span class="status-chip">${status}</span></div><span class="spectrum-card-arrow">›</span></header><div class="spectrum-card-body">${graph}${source}</div></article>`;
  return card;
}

function drawMultiChannelPlot(container, realPoints, imaginaryPoints, xLabel, yLabel, reverseX) {
  const real = (realPoints || []).map(p => ({x:Number(p.x), y:Number(p.y)})).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  const imaginary = (imaginaryPoints || []).map(p => ({x:Number(p.x), y:Number(p.y)})).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (real.length < 2 || imaginary.length < 2) {
    container.innerHTML = '<p class="muted">Les deux canaux R et I sont nécessaires pour la comparaison.</p>';
    return;
  }
  const all = [...real, ...imaginary];
  let xmin=Math.min(...all.map(p=>p.x)), xmax=Math.max(...all.map(p=>p.x));
  let ymin=Math.min(...all.map(p=>p.y)), ymax=Math.max(...all.map(p=>p.y));
  if (xmin===xmax) xmax=xmin+1; if (ymin===ymax) ymax=ymin+1;
  const W=760,H=280,L=66,R=18,T=20,B=54,PW=W-L-R,PH=H-T-B;
  const sx=x=>L+(reverseX?(xmax-x)/(xmax-xmin):(x-xmin)/(xmax-xmin))*PW;
  const sy=y=>T+PH-(y-ymin)/(ymax-ymin)*PH;
  let grid='';
  for(let i=0;i<=5;i++) { const f=i/5, xv=reverseX?xmax-(xmax-xmin)*f:xmin+(xmax-xmin)*f, x=L+PW*f; grid+=`<line x1="${x}" y1="${T}" x2="${x}" y2="${T+PH}" stroke="#e5eeec" stroke-dasharray="3 4"/><text x="${x}" y="${T+PH+20}" fill="#72878a" font-size="10" text-anchor="middle">${xv.toFixed(2)}</text>`; }
  for(let i=0;i<=4;i++) { const v=ymin+(ymax-ymin)*i/4,y=sy(v); grid+=`<line x1="${L}" y1="${y}" x2="${W-R}" y2="${y}" stroke="#e5eeec"/><text x="${L-10}" y="${y+3}" fill="#72878a" font-size="10" text-anchor="end">${v.toFixed(2)}</text>`; }
  const path = arr => [...arr].sort((a,b)=>a.x-b.x).map((p,i)=>`${i?'L':'M'}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`).join(' ');
  container.innerHTML=`<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Comparaison des canaux réel et imaginaire RMN"><g>${grid}<line x1="${L}" y1="${T+PH}" x2="${W-R}" y2="${T+PH}" stroke="#9fb3b3"/><line x1="${L}" y1="${T}" x2="${L}" y2="${T+PH}" stroke="#9fb3b3"/><path d="${path(real)}" fill="none" stroke="#147d73" stroke-width="2.3"/><path d="${path(imaginary)}" fill="none" stroke="#d97736" stroke-width="2.1" stroke-dasharray="6 3"/><text x="${L+PW/2}" y="${H-8}" text-anchor="middle" font-size="11" fill="#50686c">${escapeHTML(xLabel)}</text><text x="15" y="${T+PH/2}" transform="rotate(-90 15 ${T+PH/2})" text-anchor="middle" font-size="11" fill="#50686c">${escapeHTML(yLabel)}</text><text x="${W-150}" y="14" font-size="11" fill="#147d73">— R réel</text><text x="${W-75}" y="14" font-size="11" fill="#d97736">- - I imaginaire</text></g></svg>`;
}

function drawPeakPlot(container, peaks, xLabel) {
  const valid = peaks.map(p => ({x:Number(p.shift_ppm), y:Number(p.intensity)})).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (!valid.length) return;
  const xmin=Math.min(...valid.map(p=>p.x)), xmax=Math.max(...valid.map(p=>p.x));
  const ymax=Math.max(...valid.map(p=>p.y)) || 1;
  const W=760,H=250,L=54,R=18,T=14,B=48,PW=W-L-R,PH=H-T-B;
  const sx=x=>L+(x-xmin)/(xmax-xmin||1)*PW, sy=y=>T+PH-y/ymax*PH;
  let grid='';
  for(let i=0;i<=4;i++) { const y=T+PH-i*PH/4, v=ymax*i/4; grid+=`<line x1="${L}" y1="${y}" x2="${W-R}" y2="${y}" stroke="#e5edf6"/><text x="${L-8}" y="${y+3}" text-anchor="end" font-size="10" fill="#7187a1">${v.toFixed(0)}</text>`; }
  const sorted=[...valid].sort((a,b)=>a.x-b.x);
  for(let i=0;i<=4;i++){const v=xmin+(xmax-xmin)*i/4,x=W-R-(v-xmin)/(xmax-xmin||1)*PW;grid+=`<line x1="${x}" y1="${T}" x2="${x}" y2="${T+PH}" stroke="#e5edf6" stroke-dasharray="3 4"/><text x="${x}" y="${T+PH+18}" text-anchor="middle" font-size="10" fill="#7187a1">${v.toFixed(2)}</text>`;}
  const sticks=sorted.map(p=>`<line x1="${W-R-(p.x-xmin)/(xmax-xmin||1)*PW}" y1="${T+PH}" x2="${W-R-(p.x-xmin)/(xmax-xmin||1)*PW}" y2="${sy(p.y)}" stroke="${container.id.includes('nmr13')?'#24ad7b':'#347fd7'}" stroke-width="2.4"/>`).join('');
  container.innerHTML=`<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHTML(xLabel)} : diagramme de bâtons des pics publiés">${grid}<line x1="${L}" y1="${T+PH}" x2="${W-R}" y2="${T+PH}" stroke="#9fb3c9"/>${sticks}<text x="${L+PW/2}" y="${H-7}" text-anchor="middle" font-size="11" fill="#506886">${escapeHTML(xLabel)}</text><text x="14" y="${T+PH/2}" transform="rotate(-90 14 ${T+PH/2})" text-anchor="middle" font-size="11" fill="#506886">Intensité publiée</text></svg>`;
}

function drawPlot(container, points, xLabel, yLabel, reverseX) {
  const valid = points.map(p => ({x:Number(p.x), y:Number(p.y)})).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (valid.length < 2) {
    container.innerHTML = `<p class="muted">Données insuffisantes pour tracer le spectre.</p>`;
    return;
  }
  let xmin = Math.min(...valid.map(p=>p.x)), xmax = Math.max(...valid.map(p=>p.x));
  let ymin = Math.min(...valid.map(p=>p.y)), ymax = Math.max(...valid.map(p=>p.y));
  if (xmin === xmax) xmax = xmin + 1;
  if (ymin === ymax) ymax = ymin + 1;
  const W=760,H=260,L=66,R=18,T=16,B=52, PW=W-L-R,PH=H-T-B;
  const sx=x=>L+(reverseX ? (xmax-x)/(xmax-xmin) : (x-xmin)/(xmax-xmin))*PW;
  const sy=y=>T+PH-(y-ymin)/(ymax-ymin)*PH;
  const xTicks=5,yTicks=4;
  let grid="";
  for(let i=0;i<=xTicks;i++){
    const fraction=i/xTicks;
    const v=reverseX ? xmax-(xmax-xmin)*fraction : xmin+(xmax-xmin)*fraction;
    const x=L+PW*fraction;
    grid+=`<line x1="${x}" y1="${T}" x2="${x}" y2="${T+PH}" stroke="#e5eeec" stroke-dasharray="3 4"/><text x="${x}" y="${T+PH+20}" fill="#72878a" font-size="10" text-anchor="middle">${v.toFixed(2).replace(/\.?0+$/,"")}</text>`;
  }
  for(let i=0;i<=yTicks;i++){
    const v=ymin+(ymax-ymin)*i/yTicks,y=sy(v);
    grid+=`<line x1="${L}" y1="${y}" x2="${W-R}" y2="${y}" stroke="#e5eeec"/><text x="${L-10}" y="${y+3}" fill="#72878a" font-size="10" text-anchor="end">${v.toFixed(2).replace(/\.?0+$/,"")}</text>`;
  }
  const sorted=[...valid].sort((a,b)=>a.x-b.x);
  const path=sorted.map((p,i)=>`${i?"L":"M"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`).join(" ");
  const axis=`<line x1="${L}" y1="${T+PH}" x2="${W-R}" y2="${T+PH}" stroke="#9fb3b3"/><line x1="${L}" y1="${T}" x2="${L}" y2="${T+PH}" stroke="#9fb3b3"/>`;
  container.innerHTML=`<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Spectre ${escapeHTML(xLabel)} en fonction de ${escapeHTML(yLabel)}">${grid}${axis}<path d="${path}" fill="none" stroke="#147d73" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/><text x="${L+PW/2}" y="${H-8}" text-anchor="middle" font-size="11" fill="#50686c">${escapeHTML(xLabel)}</text><text x="15" y="${T+PH/2}" transform="rotate(-90 15 ${T+PH/2})" text-anchor="middle" font-size="11" fill="#50686c">${escapeHTML(yLabel)}</text></svg>`;
}


$("#searchInput").addEventListener("input", e => renderList(e.target.value));
document.addEventListener("keydown", e => {
  if (e.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) {
    e.preventDefault(); $("#searchInput").focus();
  }
  if (e.key === "Escape") { $("#searchInput").value=""; renderList(); }
});

function validateSpectrumPoints(key, points) {
  const ranges = {
    ir: { min: 350, max: 5000, unit: "cm⁻¹" },
    uv_vis: { min: 100, max: 1500, unit: "nm" },
    nmr_1h: { min: -5, max: 25, unit: "ppm" },
    nmr_13c: { min: -20, max: 300, unit: "ppm" }
  };
  const range = ranges[key];
  if (!range) throw new Error("Type de spectre inconnu.");
  const valid = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (valid.length < 2) throw new Error("Il faut au moins deux points numériques X/Y.");
  const outside = valid.filter(p => p.x < range.min || p.x > range.max);
  if (outside.length) {
    throw new Error(`Axe X incompatible avec le type choisi : ${outside.length} point(s) hors plage habituelle (${range.min}–${range.max} ${range.unit}). Vérifiez le type de spectre, les colonnes et les unités; aucune donnée n’a été importée.`);
  }
  const uniqueX = new Set(valid.map(p => p.x));
  if (uniqueX.size < 2) throw new Error("Les valeurs de l’axe X ne varient pas; vérifiez les colonnes et le séparateur.");
  return valid;
}

function extractJcampMetadata(text) {
  const metadata = {};
  const aliases = {
    TITLE: 'title', 'DATA TYPE': 'data_type', 'DATA CLASS': 'data_class',
    'XUNITS': 'x_unit', 'YUNITS': 'y_unit', 'XFACTOR': 'x_factor', 'YFACTOR': 'y_factor',
    'FIRSTX': 'first_x', 'LASTX': 'last_x', 'NPOINTS': 'point_count', 'DELTAX': 'delta_x',
    '.OBSERVE NUCLEUS': 'nucleus', '.OBSERVE FREQUENCY': 'observe_frequency',
    '.SOLVENT NAME': 'solvent', '.AVERAGES': 'scans', '.PULSE SEQUENCE': 'pulse_sequence',
    '.ACQUISITION MODE': 'acquisition_mode', 'SPECTROMETER/DATA SYSTEM': 'instrument',
    'LONG DATE': 'date', 'DATE': 'date', 'TIME': 'time', 'ORIGIN': 'origin', 'OWNER': 'owner'
  };
  for (const line of String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.match(/^##([^=]+)=\s*(.*)$/);
    if (!match) continue;
    const label = match[1].trim().toUpperCase();
    const key = aliases[label];
    if (key && match[2].trim()) metadata[key] = match[2].trim();
  }
  // Preserve common vendor NMR fields without interpreting them as validated values.
  for (const line of String(text || '').split(/\r?\n/)) {
    const match = line.match(/^##(\.[A-Z0-9 /_-]+)=\s*(.*)$/i);
    if (match && !metadata.vendor_fields) metadata.vendor_fields = {};
    if (match) metadata.vendor_fields[match[1].trim()] = match[2].trim();
  }
  return metadata;
}

function parseSpectrumFile(text, filename) {
  const source = String(text || '').replace(/^\uFEFF/, '');
  const lines = source.split(/\r?\n/);
  const upper = source.toUpperCase();
  const points = [];
  const isJcamp = upper.includes('##JCAMP-DX') || /^##(?:XYDATA|XYPOINTS)=/im.test(source);

  if (isJcamp) {
    // NTUPLES support is deliberately scoped to the standard 1D NMR R/I layout.
    // Pages are decoded independently through the same tested XYDATA decoder below.
    if (/^##NTUPLES=/im.test(source)) {
      const getLdr = label => {
        const m = source.match(new RegExp('^##' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=\\s*(.*)$', 'im'));
        return m ? m[1].trim() : '';
      };
      const vector = label => (getLdr(label).match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?/g) || []).map(Number);
      const symbols = (getLdr('SYMBOL').match(/[A-Za-z][A-Za-z0-9_]*/g) || []).map(v => v.toUpperCase());
      const varTypes = (getLdr('VAR_TYPE').match(/[A-Za-z]+/g) || []).map(v => v.toUpperCase());
      const varDims = vector('VAR_DIM');
      const firsts = vector('FIRST'), lasts = vector('LAST'), factors = vector('FACTOR');
      const ntupleName = getLdr('NTUPLES');
      const isOneDimensional = symbols.length >= 3 && symbols[0] === 'X' && symbols.includes('R') &&
        symbols.every((v, i) => i === 0 || ['R','I','N'].includes(v)) &&
        varTypes.length === symbols.length && varTypes[0] === 'INDEPENDENT' &&
        varDims.length === symbols.length && Number.isInteger(varDims[0]) && varDims[0] >= 2 &&
        firsts.length === symbols.length && lasts.length === symbols.length && factors.length === symbols.length &&
        symbols.filter(v => v === 'R' || v === 'I').length >= 1 &&
        varTypes.slice(1).every(v => v === 'DEPENDENT' || v === 'PAGE');
      if (!isOneDimensional || !/^NMR/i.test(ntupleName)) {
        throw new Error('NTUPLES détecté, mais sa structure n’est pas le format RMN 1D X/R/I pris en charge. Les données multidimensionnelles ou les séries ne sont pas importées.');
      }
      const pageBlocks = [...source.matchAll(/^##PAGE=\s*([^\r\n]+)([\s\S]*?)(?=^##PAGE=|^##END NTUPLES=|^##END=|$(?![\s\S]))/gim)];
      if (!pageBlocks.length) throw new Error('NTUPLES RMN 1D sans pages PAGE exploitables.');
      const channels = {};
      for (const page of pageBlocks) {
        const pageId = page[1].match(/N\s*=\s*([+-]?\d+)/i);
        const channelSymbol = page[2].match(/^##DATA TABLE=\s*\(X\+\+\(([RI])\.\.\1\)\),?\s*XYDATA/im)?.[1]?.toUpperCase();
        if (!pageId || !channelSymbol || !symbols.includes(channelSymbol)) {
          throw new Error('Page NTUPLES non reconnue : seules les pages N= associées aux canaux R/I sont prises en charge.');
        }
        const pageNumber = Number(pageId[1]);
        const channelOrdinal = symbols.filter(v => v === 'R' || v === 'I').indexOf(channelSymbol) + 1;
        if (pageNumber !== channelOrdinal) {
          throw new Error(`La page NTUPLES N=${pageNumber} ne correspond pas au canal ${channelSymbol} déclaré.`);
        }
        if (channels[channelSymbol]) throw new Error(`Page NTUPLES dupliquée pour le canal ${channelSymbol}.`);
        const dataMatch = page[2].match(/^##DATA TABLE=[^\r\n]*\r?\n([\s\S]*?)(?=^##|$)/im);
        if (!dataMatch) throw new Error(`Aucune table de données pour le canal ${channelSymbol}.`);
        const channelIndex = symbols.indexOf(channelSymbol);
        const xFactorN = factors[0] || 1, yFactorN = factors[channelIndex] || 1;
        const n = varDims[0], first = firsts[0], last = lasts[0];
        const delta = (last - first) / (n - 1);
        const synthetic = [
          '##JCAMP-DX=5.01', `##XFACTOR=${xFactorN}`, `##YFACTOR=${yFactorN}`,
          `##FIRSTX=${first}`, `##LASTX=${last}`, `##DELTAX=${delta}`,
          `##NPOINTS=${n}`, `##XYDATA=(X++(${channelSymbol}..${channelSymbol}))`,
          dataMatch[1].trim(), '##END='
        ].join('\n');
        const decoded = parseSpectrumFile(synthetic, `${filename || 'ntuples'}:${channelSymbol}`);
        if (decoded.length !== n) throw new Error(`Canal ${channelSymbol}: ${decoded.length} points décodés au lieu de ${n}.`);
        channels[channelSymbol === 'R' ? 'real' : 'imaginary'] = decoded;
      }
      if (!channels.real && !channels.imaginary) throw new Error('Aucun canal R/I exploitable dans NTUPLES.');
      if (symbols.includes('R') && !channels.real) throw new Error('Page NTUPLES du canal réel R manquante; aucun import partiel effectué.');
      if (symbols.includes('I') && !channels.imaginary) throw new Error('Page NTUPLES du canal imaginaire I manquante; aucun import partiel effectué.');
      const primary = channels.real || channels.imaginary;
      primary.channels = channels;
      primary.channel = channels.real ? 'real' : 'imaginary';
      return primary;
    }
    const titleCount = (source.match(/^##TITLE=/gim) || []).length;
    if (titleCount > 1 || /^##DATA TYPE=LINK/im.test(source) || /^##BLOCKS=/im.test(source)) {
      throw new Error('Ce fichier JCAMP-DX contient plusieurs blocs ou un conteneur LINK. Import multi-blocs non pris en charge : aucun bloc n’a été importé.');
    }
    const header = {};
    for (const line of lines) {
      const match = line.match(/^##([^=]+)=\s*(.*)$/);
      if (match) header[match[1].trim().toUpperCase()] = match[2].trim();
    }
    const modeLine = Object.keys(header).find(k => k === 'XYDATA' || k === 'XYPOINTS');
    const mode = modeLine || ''; // The LDR value is (X++(Y..Y)); dispatch on the LDR label.
    const variableList = mode ? (header[mode] || '').replace(/\s+/g, '').toUpperCase() : '';
    if (mode === 'XYDATA' && !/^\(X\+\+\([YRI]\.\.[YRI]\)\)$/.test(variableList)) {
      throw new Error(`Variable-list XYDATA non prise en charge : ${header.XYDATA || '(absente)'}. Seuls Y, R (réel) et I (imaginaire) en 1D sont acceptés.`);
    }
    const xFactor = Number(header.XFACTOR ?? 1);
    const yFactor = Number(header.YFACTOR ?? 1);
    const firstX = Number(header.FIRSTX);
    const lastX = Number(header.LASTX);
    const deltaX = Number(header.DELTAX);
    const declaredPoints = Number(header.NPOINTS);
    // JCAMP-DX ASDF decoder: AFFN/PAC absolute values, SQZ absolute values,
    // DIF deltas and DUP repeat counts. The first ordinate on each XYDATA row
    // is an absolute checkpoint; DIF continuation rows repeat the prior Y once.
    const readNumber = (str, at) => {
      const m = str.slice(at).match(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?/);
      return m ? { value: Number(m[0]), end: at + m[0].length } : null;
    };
    const sqz = {'@':0,A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,a:-1,b:-2,c:-3,d:-4,e:-5,f:-6,g:-7,h:-8,i:-9};
    const dif = {'%':0,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,j:-1,k:-2,l:-3,m:-4,n:-5,o:-6,p:-7,q:-8,r:-9};
    const dup = {S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,s:9};
    const decodeTokens = payload => {
      const out = []; let i = 0;
      while (i < payload.length) {
        if (/\s|,/.test(payload[i])) { i++; continue; }
        const ch = payload[i];
        if (ch === '?') throw new Error('Le fichier JCAMP-DX contient une ordonnée manquante ou hors échelle (?). Import interrompu pour éviter de relier artificiellement les points.');
        if (Object.prototype.hasOwnProperty.call(dup, ch)) { out.push({kind:'dup', count:dup[ch]}); i++; continue; }
        if (Object.prototype.hasOwnProperty.call(sqz, ch) || Object.prototype.hasOwnProperty.call(dif, ch)) {
          const kind = Object.prototype.hasOwnProperty.call(sqz, ch) ? 'abs' : 'dif';
          const lead = kind === 'abs' ? sqz[ch] : dif[ch];
          i++;
          const tail = payload.slice(i).match(/^\d*(?:\.\d*)?(?:[Ee][+-]?\d+)?/);
          const suffix = tail && tail[0] ? tail[0] : '';
          const value = Number(String(lead) + suffix);
          if (!Number.isFinite(value)) throw new Error('Valeur ASDF invalide dans le bloc JCAMP-DX.');
          out.push({kind, value}); i += suffix.length; continue;
        }
        const num = readNumber(payload, i);
        if (num) { out.push({kind:'abs', value:num.value}); i = num.end; continue; }
        throw new Error(`Caractère JCAMP-DX non reconnu « ${ch} » dans les données.`);
      }
      return out;
    };

    let dataStarted = false, previousY = null, previousWasDif = false, previousDelta = null;
    for (const line of lines) {
      if (/^##XYDATA=/i.test(line) || /^##XYPOINTS=/i.test(line)) { dataStarted = true; continue; }
      if (/^##/.test(line) && dataStarted) break;
      if (!dataStarted || !line.trim() || line.trim().startsWith('$$')) continue;
      if (/XYPOINTS/i.test(mode)) {
        const nums = line.trim().match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?/g)?.map(Number) || [];
        for (let j = 0; j + 1 < nums.length; j += 2) points.push({x:nums[j]*xFactor,y:nums[j+1]*yFactor});
        continue;
      }
      if (!/XYDATA/i.test(mode)) continue;
      const row = line.trim();
      const xToken = readNumber(row, 0);
      if (!xToken) continue;
      const startX = xToken.value * xFactor;
      const step = Number.isFinite(deltaX) && deltaX !== 0 ? deltaX * xFactor : NaN;
      if (!Number.isFinite(step)) continue;
      const tokens = decodeTokens(row.slice(xToken.end));
      if (!tokens.length) continue;
      const carryCheckpoint = previousWasDif;
      let yValues = [];
      for (const token of tokens) {
        if (token.kind === 'dup') {
          if (previousY === null && !yValues.length) throw new Error('DUP sans valeur précédente dans le fichier JCAMP-DX.');
          const repeated = yValues.length ? yValues[yValues.length-1] : previousY;
          for (let n=1;n<token.count;n++) yValues.push(previousWasDif ? yValues[yValues.length-1] + (previousDelta || 0) : repeated);
        } else if (token.kind === 'dif') {
          if (previousY === null && !yValues.length) throw new Error('DIF sans valeur de référence dans le fichier JCAMP-DX.');
          const base = yValues.length ? yValues[yValues.length-1] : previousY;
          const next = base + token.value; yValues.push(next); previousDelta = token.value; previousWasDif = true;
        } else {
          yValues.push(token.value); previousDelta = null; previousWasDif = false;
        }
      }
      // A DIF/DIFDUP row carries the previous row's last Y as a checkpoint.
      if (points.length && carryCheckpoint && yValues.length && Math.abs(yValues[0]-previousY) < 1e-9) yValues.shift();
      yValues.forEach((y,j)=>points.push({x:startX+j*step,y:y*yFactor}));
      if (yValues.length) previousY = yValues[yValues.length-1];
    }
    // A declared point count is a useful integrity check, not a license to invent missing points.
    if (points.length < 2) throw new Error('Aucune paire X/Y exploitable trouvée dans le JCAMP-DX. Vérifiez les en-têtes FIRSTX/DELTAX et le bloc XYDATA/XYPOINTS, ou exportez en CSV.');
    if (Number.isFinite(declaredPoints) && declaredPoints > 0 && points.length !== declaredPoints) {
      throw new Error(`Le fichier annonce ${declaredPoints} points mais ${points.length} ont été lus. Le fichier peut être tronqué ou utiliser un encodage non pris en charge; aucune donnée n’a été importée.`);
    }
    // Cross-check the decoded XYDATA endpoints against FIRSTX/LASTX.
    // A tolerance of half a sampling interval accommodates rounded header values.
    if (/XYDATA/i.test(mode) && points.length > 1) {
      const tolerance = Math.max(1e-7, Math.abs(Number.isFinite(deltaX) ? deltaX * xFactor : 0) * 0.51);
      if (Number.isFinite(firstX) && Math.abs(points[0].x - firstX * xFactor) > tolerance) {
        throw new Error(`Le premier X décodé (${points[0].x}) ne correspond pas à FIRSTX (${firstX * xFactor}). Vérifiez le fichier JCAMP-DX; aucune donnée n’a été importée.`);
      }
      if (Number.isFinite(lastX) && Math.abs(points[points.length - 1].x - lastX * xFactor) > tolerance) {
        throw new Error(`Le dernier X décodé (${points[points.length - 1].x}) ne correspond pas à LASTX (${lastX * xFactor}). Le fichier peut être tronqué ou mal encodé; aucune donnée n’a été importée.`);
      }
    }
  } else {
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
      // Supports decimal dot, comma-separated values, semicolon-separated CSV and tab-separated files.
      const cells = trimmed.includes(';') ? trimmed.split(';') : trimmed.includes('\t') ? trimmed.split('\t') : trimmed.split(',');
      if (cells.length >= 2) {
        const parseCell = value => {
          const normalized = String(value).trim().replace(/\s/g, '').replace(',', '.');
          return normalized === '' ? NaN : Number(normalized);
        };
        const x = parseCell(cells[0]), y = parseCell(cells[1]);
        if (Number.isFinite(x) && Number.isFinite(y)) { points.push({ x, y }); continue; }
      }
      // Whitespace-delimited numeric pairs (header lines are ignored).
      const cells2 = trimmed.split(/\s+/);
      if (cells2.length >= 2) {
        const x = Number(cells2[0]), y = Number(cells2[1]);
        if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
      }
    }
  }
  const deduplicated = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (deduplicated.length > 1 && deduplicated.every((p, i) => i === 0 || p.x === deduplicated[i - 1].x)) {
    throw new Error('Les valeurs X semblent toutes identiques; vérifiez le séparateur et l’ordre des colonnes.');
  }
  return deduplicated;
}


// --- Formulaire d'import (remplace les prompt() successifs) ---
const conditionsFrom = (jcampMetadata) => [jcampMetadata.solvent && `Solvant: ${jcampMetadata.solvent}`, jcampMetadata.observe_frequency && `Fréquence: ${jcampMetadata.observe_frequency}`, jcampMetadata.nucleus && `Noyau: ${jcampMetadata.nucleus}`, jcampMetadata.instrument && `Appareil: ${jcampMetadata.instrument}`, jcampMetadata.scans && `Accumulations: ${jcampMetadata.scans}`, jcampMetadata.pulse_sequence && `Séquence: ${jcampMetadata.pulse_sequence}`].filter(Boolean).join('; ');
function guessSpectrumKey(name, meta) {
  const n = `${name} ${meta.nucleus || ''}`.toLowerCase();
  if (/13c|c-?13/.test(n)) return 'nmr_13c';
  if (/1h|h-?1|proton|nmr|rmn/.test(n)) return 'nmr_1h';
  if (/uv|vis/.test(n)) return 'uv_vis';
  return 'ir';
}
function openImportDialog(file, meta, m) {
  return new Promise(resolve => {
    let dlg = document.getElementById('importDialog');
    dlg?.remove();
    dlg = document.createElement('dialog'); dlg.id = 'importDialog'; dlg.className = 'import-dialog';
    const opts = Object.entries(SPECTRA).map(([k, v]) => `<option value="${k}">${escapeHTML(v.label)}</option>`).join('');
    dlg.innerHTML = `<form method="dialog" class="import-form">
      <h3>Importer « ${escapeHTML(file.name)} »</h3><p class="muted">Pour : <strong>${escapeHTML(m.name)}</strong>. Renseignez la source pour que le spectre soit traçable.</p>
      <label>Type de spectre<select name="key">${opts}</select></label>
      <label>Source (base de données, laboratoire, publication)<input name="sourceName" type="text"></label>
      <label>URL de la source (https://…)<input name="sourceUrl" type="url" placeholder="https://"></label>
      <label>Référence / identifiant du spectre<input name="citation" type="text"></label>
      <label>Conditions expérimentales<textarea name="conditions" rows="2"></textarea></label>
      <div class="two"><label>Unité axe X<input name="xUnit" type="text"></label><label>Unité axe Y<input name="yUnit" type="text"></label></div>
      <div class="actions"><button type="button" value="cancel" class="btn-cancel">Annuler</button><button type="submit" value="ok" class="btn-ok">Importer</button></div></form>`;
    document.body.appendChild(dlg);
    const f = dlg.querySelector('form'), g = n => f.elements[n];
    const fill = () => {
      const k = g('key').value, old = m.spectra?.[k] || {};
      g('sourceName').value = old.source_name || meta.origin || '';
      g('sourceUrl').value = old.source_url || '';
      g('citation').value = old.citation || '';
      g('conditions').value = old.conditions?.note || conditionsFrom(meta);
      g('xUnit').value = old.x_unit || (k === 'ir' ? 'cm⁻¹' : k.startsWith('nmr') ? 'ppm' : 'nm');
      g('yUnit').value = old.y_unit || SPECTRA[k].y;
    };
    g('key').value = guessSpectrumKey(file.name, meta); fill();
    g('key').addEventListener('change', fill);
    let result = null;
    f.addEventListener('submit', () => { result = Object.fromEntries(new FormData(f)); });
    dlg.querySelector('.btn-cancel').addEventListener('click', () => dlg.close());
    dlg.addEventListener('close', () => { dlg.remove(); resolve(result); });
    dlg.showModal();
  });
}

async function importSpectrumFile(file) {
  const m = molecules.find(item => item.id === selectedId);
  if (!m) { alert('Choisissez d’abord un médicament.'); return; }
  try {
    const text = await file.text();
    const parsedPoints = parseSpectrumFile(text, file.name);
    const jcampMetadata = extractJcampMetadata(text);
    const form = await openImportDialog(file, jcampMetadata, m);
    if (!form) return;
    const key = form.key;
    const points = validateSpectrumPoints(key, parsedPoints);
    const jcampHeader = text.match(/^##XYDATA=\s*(.*)$/im);
    const jcampVariableList = jcampHeader?.[1]?.trim().toUpperCase() || '';
    const jcampChannel = parsedPoints.channel || (/\(X\+\+\(R\.\.R\)\)/.test(jcampVariableList) ? 'real' : /\(X\+\+\(I\.\.I\)\)/.test(jcampVariableList) ? 'imaginary' : null);
    const old = m.spectra?.[key] || {};
    const sourceName = form.sourceName;
    const sourceUrl = /^https?:\/\//i.test(form.sourceUrl || '') ? form.sourceUrl.trim() : null;
    const citation = form.citation;
    const conditions = form.conditions;
    const xUnit = form.xUnit || (key==='ir'?'cm⁻¹':key.startsWith('nmr')?'ppm':'nm');
    const yUnit = form.yUnit || 'Intensité (u.a.) — à confirmer';
    const metadataComplete = Boolean(sourceName?.trim() && sourceUrl && citation?.trim() && conditions?.trim() && xUnit.trim() && yUnit.trim() && !/à confirmer|unknown|inconnu/i.test(`${xUnit} ${yUnit}`));
    sessionImports[`${m.id}:${key}`] = {
      ...old,
      status: 'imported_needs_source_review',
      source_name: sourceName?.trim() || `Fichier local importé : ${file.name}`,
      source_url: sourceUrl,
      citation: citation?.trim() || 'Référence bibliographique non fournie; validation scientifique en attente.',
      conditions: { ...(old.conditions || {}), note: conditions?.trim() || 'Conditions expérimentales non fournies; validation scientifique en attente.' },
      metadata_complete: metadataComplete,
      points,
      peaks: [],
      data_file: file.name,
      jcamp_channel: jcampChannel,
      jcamp_channels: parsedPoints.channels ? { real: parsedPoints.channels.real || null, imaginary: parsedPoints.channels.imaginary || null } : null,
      x_unit: xUnit.trim(),
      y_unit: yUnit.trim(),
      jcamp_metadata: jcampMetadata
    };
    idb.put('imports', { key: `${m.id}:${key}`, ...sessionImports[`${m.id}:${key}`] }).catch(e => console.warn('Sauvegarde IndexedDB impossible', e));
    renderDetails(m);
    alert(`${points.length} points importés${parsedPoints.channels ? ` (canaux NTUPLES : ${Object.keys(parsedPoints.channels).join(' + ')})` : jcampChannel ? ` (canal ${jcampChannel === 'real' ? 'réel' : 'imaginaire'})` : ''} pour ${SPECTRA[key].label}. Les points ont passé les contrôles numériques et de plage X; ce n’est pas une certification scientifique. Métadonnées ${metadataComplete ? 'renseignées, à vérifier contre le fichier source' : 'incomplètes : provenance/conditions/unités à compléter'}. Elles sont enregistrées dans la base IndexedDB de ce navigateur (export JSON possible).`);
  } catch (err) {
    alert(`Import impossible : ${err.message}`);
  }
}

function exportIntegratedData() {
  const output = JSON.parse(JSON.stringify({ molecules }));
  let integrated = 0;
  for (const m of output.molecules) {
    for (const key of Object.keys(SPECTRA)) {
      const imported = sessionImports[`${m.id}:${key}`];
      if (!imported) continue;
      if (!Array.isArray(imported.points) || imported.points.length < 2) continue;
      const target = m.spectra ||= {};
      target[key] = { ...target[key], ...imported, status: 'imported_needs_source_review' };
      integrated++;
    }
  }
  if (!integrated) {
    alert('Aucun spectre numérique importé à exporter. Téléchargez un fichier depuis la source, puis importez-le d’abord.');
    return;
  }
  const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'molecules-with-imported-spectra.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  alert(`Export JSON créé avec ${integrated} spectre(s). Vérifiez la source, les unités et les métadonnées avant de remplacer data/molecules.json.`);
}

const exportBtn = document.querySelector('#exportDataBtn');
if (exportBtn) exportBtn.addEventListener('click', exportIntegratedData);

const importBtn = document.querySelector('#importSpectrumBtn');
const fileInput = document.querySelector('#spectrumFileInput');
const helpBtn = document.querySelector('#importHelpBtn');
if (importBtn && fileInput) importBtn.addEventListener('click', () => fileInput.click());
if (helpBtn && fileInput) helpBtn.addEventListener('click', () => fileInput.click());
if (fileInput) fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (file) await importSpectrumFile(file);
  fileInput.value = '';
});

init();
