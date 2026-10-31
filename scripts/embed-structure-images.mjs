#!/usr/bin/env node
/**
 * Intègre les images 2D PubChem dans data/molecules.json sous forme de data URI.
 * À exécuter UNE FOIS avec Internet; ensuite l'application affiche les images hors ligne.
 * Usage: node scripts/embed-structure-images.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(root, 'data', 'molecules.json');
const data = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
let success = 0;
const failed = [];
for (const molecule of data.molecules) {
  if (molecule.structure_image_data?.startsWith('data:image/png;base64,')) {
    success++;
    continue;
  }
  if (!molecule.pubchem_cid) { failed.push(`${molecule.name}: CID PubChem absent`); continue; }
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(molecule.pubchem_cid)}/PNG?image_size=1000x1000`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'PharmaSpectra/1.0.6 (offline image integration)' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 100 || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) throw new Error('réponse PNG invalide');
    molecule.structure_image_data = `data:image/png;base64,${bytes.toString('base64')}`;
    delete molecule.structure_image_url;
    success++;
    console.log(`✓ ${molecule.name} (${Math.round(bytes.length/1024)} Ko)`);
    await new Promise(resolve => setTimeout(resolve, 250));
  } catch (error) {
    failed.push(`${molecule.name}: ${error.message}`);
    console.error(`✗ ${molecule.name}: ${error.message}`);
  }
}
data.dataVersion = `1.0.6-offline-structures-${Date.now()}`;
await fs.writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n');
console.log(`\nImages intégrées: ${success}/${data.molecules.length}`);
if (failed.length) {
  console.error('Images manquantes:\n' + failed.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Terminé: les images sont maintenant stockées dans data/molecules.json et visibles hors ligne.');
}
