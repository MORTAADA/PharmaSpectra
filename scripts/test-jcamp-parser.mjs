import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const metaStart = app.indexOf('function extractJcampMetadata(');
const metaEnd = app.indexOf('\nfunction parseSpectrumFile', metaStart);
assert(metaStart >= 0 && metaEnd > metaStart, 'extractJcampMetadata function must exist');
const metaSandbox = {};
vm.runInNewContext(`${app.slice(metaStart, metaEnd)}; this.extractJcampMetadata = extractJcampMetadata;`, metaSandbox);
const extractMeta = metaSandbox.extractJcampMetadata;
const start = app.indexOf('function parseSpectrumFile(');
const end = app.indexOf('\nasync function importSpectrumFile', start);
assert(start >= 0 && end > start, 'parseSpectrumFile function must exist');
const sandbox = {};
vm.runInNewContext(`${app.slice(start, end)}; this.parseSpectrumFile = parseSpectrumFile;`, sandbox);
const parse = sandbox.parseSpectrumFile;
const pac = `##JCAMP-DX=5.01\n##XFACTOR=1\n##YFACTOR=0.1\n##DELTAX=1\n##NPOINTS=3\n##XYDATA=(X++(Y..Y))\n4000+310+322+334\n##END=`;
assert.deepEqual(JSON.parse(JSON.stringify(parse(pac, 'pac.jdx'))), [
  {x:4000,y:31}, {x:4001,y:32.2}, {x:4002,y:33.4}
]);
const exponent = `##JCAMP-DX=5.01\n##XFACTOR=1\n##YFACTOR=1\n##NPOINTS=2\n##DELTAX=1\n##XYDATA=(X++(Y..Y))\n1 1.2E-3 2.4E+2\n##END=`;
assert.deepEqual(JSON.parse(JSON.stringify(parse(exponent, 'exp.jdx'))), [
  {x:1,y:0.0012}, {x:2,y:240}
]);
const xy = `##JCAMP-DX=5.01\n##XFACTOR=2\n##YFACTOR=0.5\n##NPOINTS=2\n##XYPOINTS=(XY..XY)\n10 4; 20 8\n##END=`;
assert.deepEqual(JSON.parse(JSON.stringify(parse(xy, 'xy.jdx'))), [
  {x:20,y:2}, {x:40,y:4}
]);
const affn = `##JCAMP-DX=5.01\n##XFACTOR=1\n##YFACTOR=1\n##NPOINTS=3\n##DELTAX=0.5\n##XYDATA=(X++(Y..Y))\n100 1 2 3\n##END=`;
assert.equal(parse(affn, 'affn.jdx').length, 3);
const mismatch = affn.replace('##NPOINTS=3', '##NPOINTS=4');
assert.throws(() => parse(mismatch, 'bad.jdx'), /annonce 4 points/);
const compressed = affn.replace('100 1 2 3', '100A10JT');
assert.equal(parse(compressed, 'sqz.jdx').length, 3);
console.log('JCAMP parser tests passed: PAC, AFFN, XYPOINTS, factors, exponents, NPOINTS, SQZ/DIF/DUP decoding.');
const sqz = `##JCAMP-DX=5.01\n##XFACTOR=1\n##YFACTOR=1\n##DELTAX=1\n##NPOINTS=3\n##XYDATA=(X++(Y..Y))\n4000A10B20C30\n##END=`;
assert.deepEqual(JSON.parse(JSON.stringify(parse(sqz, 'sqz.jdx'))), [
  {x:4000,y:110}, {x:4001,y:220}, {x:4002,y:330}
]);
const difdup = `##JCAMP-DX=5.01\n##XFACTOR=1\n##YFACTOR=1\n##DELTAX=1\n##NPOINTS=3\n##XYDATA=(X++(Y..Y))\n100A10J2\n103A22J2\n##END=`;
assert.deepEqual(JSON.parse(JSON.stringify(parse(difdup, 'difdup.jdx'))), [
  {x:100,y:110}, {x:101,y:122}, {x:103,y:134}
]);
const dup = `##JCAMP-DX=5.01\n##XFACTOR=1\n##YFACTOR=1\n##DELTAX=1\n##NPOINTS=2\n##XYDATA=(X++(Y..Y))\n100A10T\n##END=`;
assert.deepEqual(JSON.parse(JSON.stringify(parse(dup, 'dup.jdx'))), [
  {x:100,y:110}, {x:101,y:110}
]);
const signedAsdf = `##JCAMP-DX=5.01\n##XFACTOR=1\n##YFACTOR=1\n##DELTAX=1\n##NPOINTS=2\n##XYDATA=(X++(Y..Y))\n100a5j2\n##END=`;
assert.deepEqual(JSON.parse(JSON.stringify(parse(signedAsdf, 'signed-asdf.jdx'))), [
  {x:100,y:-15}, {x:101,y:-27}
]);

const missing = affn.replace('100 1 2 3', '100 1 ? 3');
assert.throws(() => parse(missing, 'missing.jdx'), /ordonnée manquante/);
const difdupRepeated = `##JCAMP-DX=5.01\n##XFACTOR=1\n##YFACTOR=1\n##DELTAX=1\n##NPOINTS=3\n##XYDATA=(X++(Y..Y))\n100A10JT\n##END=`;
assert.deepEqual(JSON.parse(JSON.stringify(parse(difdupRepeated, 'difdup-dup.jdx'))), [
  {x:100,y:110}, {x:101,y:111}, {x:102,y:112}
]);
console.log('Additional safeguards passed: missing ordinates are rejected; DUP repeat count is checked.');

const ntuples = `##JCAMP-DX=5.01\n##DATA TYPE=NMR SPECTRUM\n##NTUPLES=\n##END=`;
assert.throws(() => parse(ntuples, 'ntuples.jdx'), /NTUPLES.*format RMN 1D/);
const multi = `##JCAMP-DX=5.01\n##TITLE=block one\n##XYDATA=(X++(Y..Y))\n1 1 2\n##END=\n##TITLE=block two\n##XYDATA=(X++(Y..Y))\n1 3 4\n##END=`;
assert.throws(() => parse(multi, 'multi.jdx'), /plusieurs blocs/);
console.log('Unsupported multidimensional and multi-block layouts are explicitly rejected.');

const endpoints = `##JCAMP-DX=5.01\n##XFACTOR=1\n##YFACTOR=1\n##FIRSTX=100\n##LASTX=102\n##DELTAX=1\n##NPOINTS=3\n##XYDATA=(X++(Y..Y))\n100 10 20 30\n##END=`;
assert.equal(parse(endpoints, 'endpoints.jdx').length, 3);
const badLastX = endpoints.replace('##LASTX=102', '##LASTX=103');
assert.throws(() => parse(badLastX, 'bad-lastx.jdx'), /ne correspond pas à LASTX/);
const badFirstX = endpoints.replace('##FIRSTX=100', '##FIRSTX=99');
assert.throws(() => parse(badFirstX, 'bad-firstx.jdx'), /ne correspond pas à FIRSTX/);
console.log('Header integrity checks passed: FIRSTX and LASTX are cross-validated against decoded XYDATA.');

const realNmr = `##JCAMP-DX=5.01\n##XFACTOR=1\n##YFACTOR=1\n##DELTAX=0.1\n##NPOINTS=3\n##XYDATA=(X++(R..R))\n0 10 20 30\n##END=`;
assert.deepEqual(JSON.parse(JSON.stringify(parse(realNmr, 'real-nmr.jdx'))), [
  {x:0,y:10}, {x:0.1,y:20}, {x:0.2,y:30}
]);
const imaginaryNmr = realNmr.replace('(R..R)', '(I..I)').replace('10 20 30', '-10 -20 -30');
assert.deepEqual(JSON.parse(JSON.stringify(parse(imaginaryNmr, 'imag-nmr.jdx'))), [
  {x:0,y:-10}, {x:0.1,y:-20}, {x:0.2,y:-30}
]);
const unsupportedVariableList = realNmr.replace('(R..R)', '(A..A)');
assert.throws(() => parse(unsupportedVariableList, 'unsupported-channel.jdx'), /Variable-list XYDATA non prise en charge/);
console.log('NMR 1D channel layouts passed: real R, imaginary I, unsupported variable-list rejected.');

const nmrMeta = extractMeta(`##TITLE=Test proton spectrum
##DATA TYPE=NMR SPECTRUM
##.OBSERVE NUCLEUS=^1H
##.OBSERVE FREQUENCY=400.1324
##.SOLVENT NAME=DMSO-d6
##.AVERAGES=16
##.PULSE SEQUENCE=zg30
##SPECTROMETER/DATA SYSTEM=Bruker Avance
##XUNITS=HZ
##YUNITS=ARBITRARY UNITS
##END=`);
assert.equal(nmrMeta.title, 'Test proton spectrum');
assert.equal(nmrMeta.nucleus, '^1H');
assert.equal(nmrMeta.observe_frequency, '400.1324');
assert.equal(nmrMeta.solvent, 'DMSO-d6');
assert.equal(nmrMeta.scans, '16');
assert.equal(nmrMeta.instrument, 'Bruker Avance');
assert.equal(nmrMeta.x_unit, 'HZ');
console.log('JCAMP metadata extraction passed: title, nucleus, frequency, solvent, scans, instrument and units.');

// Scoped NTUPLES 1D NMR: separate real and imaginary PAGE channels.
const ntuples1d = `##JCAMP-DX=5.01
##DATA TYPE=NMR SPECTRUM
##NTUPLES=NMR SPECTRUM
##VAR_NAME=FREQUENCY,SPECTRUM/REAL,SPECTRUM/IMAG,PAGE NUMBER
##SYMBOL=X,R,I,N
##VAR_TYPE=INDEPENDENT,DEPENDENT,DEPENDENT,PAGE
##VAR_FORM=AFFN,ASDF,ASDF,AFFN
##VAR_DIM=3,3,3,2
##UNITS=HZ,ARBITRARY UNITS,ARBITRARY UNITS,
##FIRST=0,10,-10,1
##LAST=2,30,-30,2
##FACTOR=1,1,1,1
##PAGE=N=1
##DATA TABLE=(X++(R..R)), XYDATA
0 10 20 30
##PAGE=N=2
##DATA TABLE=(X++(I..I)), XYDATA
0 -10 -20 -30
##END NTUPLES=NMR SPECTRUM
##END=`;
const ntupleParsed = parse(ntuples1d, 'nmr-ntuples-1d.jdx');
assert.deepEqual(JSON.parse(JSON.stringify(ntupleParsed)), [
  {x:0,y:10}, {x:1,y:20}, {x:2,y:30}
]);
assert.deepEqual(JSON.parse(JSON.stringify(ntupleParsed.channels.real)), [
  {x:0,y:10}, {x:1,y:20}, {x:2,y:30}
]);
assert.deepEqual(JSON.parse(JSON.stringify(ntupleParsed.channels.imaginary)), [
  {x:0,y:-10}, {x:1,y:-20}, {x:2,y:-30}
]);
assert.equal(ntupleParsed.channel, 'real');
const ntuples2d = ntuples1d.replace('##VAR_NAME=FREQUENCY,SPECTRUM/REAL,SPECTRUM/IMAG,PAGE NUMBER', '##VAR_NAME=F1,F2,SPECTRUM,PAGE NUMBER').replace('##SYMBOL=X,R,I,N', '##SYMBOL=X,Y,Z,N');
assert.throws(() => parse(ntuples2d, 'nmr-ntuples-2d.jdx'), /structure n’est pas le format RMN 1D/);
console.log('NTUPLES 1D NMR passed: real/imaginary pages decoded separately; multidimensional layout rejected.');
const ntuplesMissingImag = ntuples1d.replace(/##PAGE=N=2[\s\S]*?##END NTUPLES=NMR SPECTRUM/, '##END NTUPLES=NMR SPECTRUM');
assert.throws(() => parse(ntuplesMissingImag, 'missing-imaginary-page.jdx'), /canal imaginaire I manquante/);
console.log('NTUPLES completeness safeguard passed: declared R/I pages cannot be silently omitted.');
