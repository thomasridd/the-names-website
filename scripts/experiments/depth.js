#!/usr/bin/env node
// Classifies names by historical depth:
//   Surface   - ever in top 100 in the historic file
//   Twilight  - ever ranked 101-1000 in modern file, not Surface
//   The Abyss - birth count below 10 or unranked in ALL modern years, not Surface or Twilight
//   Midnight  - all remaining names
// Produces experiment-data/depth/boys.json and girls.json

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
  const modern = nameObj.rankFrom1996 || [];
  const counts = nameObj.countFrom1996 || [];

  // Surface: ever in top 100 in historic file
  const everTop100Historic = historic.some(v => {
    const r = parseNum(v);
    return r !== null && r <= 100;
  });
  if (everTop100Historic) return 'Surface';

  // Twilight: ever ranked 101-1000 in modern file, not Surface
  const everRanked101to1000 = modern.some(v => {
    const r = parseNum(v);
    return r !== null && r >= 101 && r <= 1000;
  });
  if (everRanked101to1000) return 'Twilight';

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

function generateClassification(names) {
  const classNames = { Surface: [], Twilight: [], Midnight: [], 'The Abyss': [] };
  const classObjs  = { Surface: [], Twilight: [], Midnight: [], 'The Abyss': [] };
  names.forEach(nameObj => {
    const cls = classify(nameObj);
    classNames[cls].push(nameObj.name);
    classObjs[cls].push(nameObj);
  });
  Object.keys(classNames).forEach(k => {
    // sort names alphabetically
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

// Name lists (existing format)
const boysClasses = Object.fromEntries(Object.keys(boys.classNames).map(k => [k, boys.classNames[k]]));
const girlsClasses = Object.fromEntries(Object.keys(girls.classNames).map(k => [k, girls.classNames[k]]));

// Metadata: total births per class across both sexes
const metadata = {};
Object.keys(boys.classNames).forEach(cls => {
  metadata[cls] = {
    totalBirths: sumBirths(boys.classObjs[cls]) + sumBirths(girls.classObjs[cls])
  };
});

fs.writeFileSync(path.join(outputDir, 'boys.json'), JSON.stringify(boysClasses, null, 2));
fs.writeFileSync(path.join(outputDir, 'girls.json'), JSON.stringify(girlsClasses, null, 2));
fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

console.log('\nGenerated depth experiment data:');
['Surface', 'Twilight', 'The Abyss', 'Midnight'].forEach(cls => {
  console.log(`  ${cls}: ${(boys.classNames[cls].length + girls.classNames[cls].length)} names, ${metadata[cls].totalBirths.toLocaleString()} total births`);
});
