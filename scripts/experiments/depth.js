#!/usr/bin/env node
// Classifies names by historical depth:
//   Surface Current  - ever top 100 historically AND 2024 rank <= 100
//   Surface Past     - ever top 100 historically but 2024 rank > 100 or unranked
//   Twilight Current - ever ranked 101-1000 in modern, not Surface, AND 2024 rank 101-1000
//   Twilight Past    - ever ranked 101-1000 in modern, not Surface, but 2024 rank outside 101-1000
//   The Abyss        - birth count below 10 or unranked in ALL modern years, not Surface or Twilight
//   Midnight         - all remaining names
// Produces experiment-data/depth/boys.json, girls.json, metadata.json

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');
const outputDir = path.join(__dirname, '..', '..', 'experiment-data', 'depth');

function loadData(gender) {
  const devPath = path.join(dataDir, `${gender}-dev.json`);
  const prodPath = path.join(dataDir, `${gender}.json`);
  if (fs.existsSync(devPath)) {
    console.log(`Using dev data for ${gender}`);
    return JSON.parse(fs.readFileSync(devPath, 'utf-8'));
  }
  return JSON.parse(fs.readFileSync(prodPath, 'utf-8'));
}

function parseNum(val) {
  if (val === 'x' || val === null || val === undefined) return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function classify(nameObj) {
  const historic = nameObj.rankHistoric || [];
  const modern   = nameObj.rankFrom1996 || [];
  const counts   = nameObj.countFrom1996 || [];
  const rank2024 = parseNum(modern[28]); // index 28 = 2024

  // Surface: ever in top 100 in historic file
  const everTop100Historic = historic.some(v => {
    const r = parseNum(v);
    return r !== null && r <= 100;
  });
  if (everTop100Historic) {
    return (rank2024 !== null && rank2024 <= 100) ? 'Surface Current' : 'Surface Past';
  }

  // Twilight: ever ranked 101-1000 in modern file, not Surface
  const everRanked101to1000 = modern.some(v => {
    const r = parseNum(v);
    return r !== null && r >= 101 && r <= 1000;
  });
  if (everRanked101to1000) {
    return (rank2024 !== null && rank2024 >= 101 && rank2024 <= 1000)
      ? 'Twilight Current'
      : 'Twilight Past';
  }

  // The Abyss: birth count below 10 or unranked in ALL modern years
  const everCount10orMore = counts.some(v => {
    const c = parseNum(v);
    return c !== null && c >= 10;
  });
  if (!everCount10orMore) return 'The Abyss';

  // Midnight: everything else
  return 'Midnight';
}

function sumBirths(names) {
  let total = 0;
  names.forEach(n => {
    (n.countFrom1996 || []).forEach(v => {
      const c = parseNum(v);
      if (c !== null) total += c;
    });
  });
  return total;
}

const CLASS_ORDER = ['Surface Current', 'Surface Past', 'Twilight Current', 'Twilight Past', 'The Abyss', 'Midnight'];

function generateClassification(names) {
  const classNames = Object.fromEntries(CLASS_ORDER.map(c => [c, []]));
  const classObjs  = Object.fromEntries(CLASS_ORDER.map(c => [c, []]));
  names.forEach(nameObj => {
    const cls = classify(nameObj);
    classNames[cls].push(nameObj.name);
    classObjs[cls].push(nameObj);
  });
  CLASS_ORDER.forEach(k => {
    const paired = classNames[k].map((name, i) => ({ name, obj: classObjs[k][i] }));
    paired.sort((a, b) => a.name.localeCompare(b.name));
    classNames[k] = paired.map(p => p.name);
    classObjs[k]  = paired.map(p => p.obj);
  });
  return { classNames, classObjs };
}

fs.mkdirSync(outputDir, { recursive: true });

const boysData = loadData('boys');
const girlsData = loadData('girls');

const boys = generateClassification(boysData);
const girls = generateClassification(girlsData);

const boysClasses = Object.fromEntries(CLASS_ORDER.map(k => [k, boys.classNames[k]]));
const girlsClasses = Object.fromEntries(CLASS_ORDER.map(k => [k, girls.classNames[k]]));

const metadata = {};
CLASS_ORDER.forEach(cls => {
  metadata[cls] = {
    totalBirths: sumBirths(boys.classObjs[cls]) + sumBirths(girls.classObjs[cls])
  };
});

fs.writeFileSync(path.join(outputDir, 'boys.json'), JSON.stringify(boysClasses, null, 2));
fs.writeFileSync(path.join(outputDir, 'girls.json'), JSON.stringify(girlsClasses, null, 2));
fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

console.log('\nGenerated depth experiment data:');
CLASS_ORDER.forEach(cls => {
  const count = boys.classNames[cls].length + girls.classNames[cls].length;
  console.log(`  ${cls}: ${count} names, ${metadata[cls].totalBirths.toLocaleString()} total births`);
});
