#!/usr/bin/env node
/** Structural and provenance-completeness audit. Does not certify scientific validity. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(root, 'data', 'molecules.json');
const reportPath = path.join(root, 'data', 'spectral-audit-report.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const required = ['ir', 'nmr_1h', 'nmr_13c', 'uv_vis'];
const definitions = {
  uv_vis: { x: [100, 1500], unit: 'nm' },
  ir: { x: [350, 5000], unit: 'cm⁻¹' },
  nmr_1h: { x: [-5, 25], unit: 'ppm' },
  nmr_13c: { x: [-20, 300], unit: 'ppm' }
};
const errors = [], warnings = [], rows = [];
if (!Array.isArray(data.molecules)) throw new Error('Le champ molecules doit être un tableau.');
const ids = new Set();
const totals = { expected: 0, numericCurves: 0, peakLists: 0, referenceImages: 0, sourceLinked: 0, missingSource: 0, missingAllData: 0 };
for (const [i, m] of data.molecules.entries()) {
  const label = `${m?.name || '(sans nom)'} [${m?.id || i}]`;
  if (!m?.id || !m?.name) errors.push(`${label}: identifiant ou nom manquant.`);
  if (ids.has(m?.id)) errors.push(`${label}: identifiant dupliqué.`);
  ids.add(m?.id);
  if (!m?.formula) warnings.push(`${label}: formule moléculaire absente.`);
  const row = { id: m?.id || null, name: m?.name || null, spectra: {}, summary: { completeNumericCurves: 0, peakLists: 0, images: 0, missing: 0 } };
  for (const key of required) {
    totals.expected++;
    const spec = m?.spectra?.[key];
    if (!spec || typeof spec !== 'object') {
      errors.push(`${label}/${key}: emplacement de spectre manquant.`);
      row.spectra[key] = { status: 'missing_slot', points: 0, peaks: 0, image: false, source: false };
      row.summary.missing++; totals.missingAllData++; totals.missingSource++;
      continue;
    }
    const points = Array.isArray(spec.points) ? spec.points : [];
    const peaks = Array.isArray(spec.peaks) ? spec.peaks : [];
    const hasImage = Boolean(spec.spectrum_image_url);
    const hasSource = Boolean(spec.source_url && spec.source_name);
    const numeric = points.length >= 2;
    if (points.length === 1) errors.push(`${label}/${key}: un seul point ne constitue pas une courbe.`);
    if (!spec.source_url || !spec.source_name) { totals.missingSource++; warnings.push(`${label}/${key}: source absente ou insuffisamment identifiée.`); }
    else totals.sourceLinked++;
    if (numeric) {
      totals.numericCurves++; row.summary.completeNumericCurves++;
      if (!hasSource) warnings.push(`${label}/${key}: points numériques sans source vérifiable complète.`);
      if (!spec.x_unit || !spec.y_unit) warnings.push(`${label}/${key}: unité d’axe manquante.`);
    } else if (peaks.length) {
      totals.peakLists++; row.summary.peakLists++;
      warnings.push(`${label}/${key}: liste de ${peaks.length} pic(s), pas une courbe complète.`);
    } else if (hasImage) {
      totals.referenceImages++; row.summary.images++;
      warnings.push(`${label}/${key}: image de référence seulement; aucune courbe numérique locale.`);
    } else {
      totals.missingAllData++; row.summary.missing++;
      warnings.push(`${label}/${key}: aucune donnée numérique, liste de pics ou image de référence locale/externe déclarée.`);
    }
    if (numeric && peaks.length) warnings.push(`${label}/${key}: présence simultanée de points et de pics; confirmer que les formats ne sont pas confondus.`);
    const { x: [min, max], unit } = definitions[key];
    for (const [j, p] of points.entries()) {
      if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y)) errors.push(`${label}/${key}: point ${j + 1} non numérique.`);
      else if (p.x < min || p.x > max) errors.push(`${label}/${key}: X=${p.x} hors plage de contrôle ${min}–${max} ${unit}.`);
    }
    row.spectra[key] = { status: spec.status || 'status_not_set', points: points.length, peaks: peaks.length, image: hasImage, source: hasSource, source_url: spec.source_url || null, data_file: spec.data_file || null };
  }
  rows.push(row);
}
const report = {
  report_version: '1.0', generated_at: new Date().toISOString(), dataset_version: data.dataset_version || null,
  scientific_validation: 'NOT_CERTIFIED_BY_AUTOMATED_AUDIT', molecule_count: data.molecules.length,
  totals, errors, warnings, molecules: rows,
  policy: 'A source link, an image, a peak list, and a complete numeric spectrum are different evidence types. Automated checks do not validate scientific authenticity.'
};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(`PharmaSpectra ${data.dataset_version || '(version non renseignée)'} — ${data.molecules.length} molécules`);
console.log(`Emplacements spectraux attendus : ${totals.expected}`);
console.log(`Courbes numériques complètes (>=2 points) : ${totals.numericCurves}`);
console.log(`Listes de pics seulement : ${totals.peakLists}`);
console.log(`Images de référence seulement : ${totals.referenceImages}`);
console.log(`Sans courbe, liste de pics ni image : ${totals.missingAllData}`);
console.log(`Emplacements avec source identifiée : ${totals.sourceLinked}/${totals.expected}`);
console.log(`Erreurs structurelles/plausibilité : ${errors.length}`);
console.log(`Avertissements de complétude/provenance : ${warnings.length}`);
console.log(`Rapport détaillé : ${path.relative(root, reportPath)}`);
for (const e of errors) console.error(`ERREUR: ${e}`);
if (!errors.length) console.log('Audit technique réussi. Cela ne remplace pas la validation scientifique des sources et conditions expérimentales.');
if (errors.length) process.exitCode = 1;
