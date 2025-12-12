const fs = require('fs');
const path = require('path');

// File paths
const synonymsFile = path.join(__dirname, '../data/synonyms.txt');
const boysFile = path.join(__dirname, '../data/boys.json');
const girlsFile = path.join(__dirname, '../data/girls.json');

console.log('Loading synonyms data...');

// Read and parse synonyms.txt
const synonymsText = fs.readFileSync(synonymsFile, 'utf-8');
const lines = synonymsText.split('\n');

// Build a lookup map: name -> { gender, related }
const synonymsMap = new Map();

for (const line of lines) {
  // Skip comments and empty lines
  if (line.startsWith('#') || line.trim() === '') continue;

  const parts = line.split('\t');
  if (parts.length < 3) continue;

  const [name, gender, relatedStr] = parts;
  const related = relatedStr ? relatedStr.split(',').map(n => n.trim()).filter(n => n !== '') : [];

  // Store both the original name and lowercase version for matching
  const key = name.toLowerCase();

  if (!synonymsMap.has(key)) {
    synonymsMap.set(key, []);
  }

  synonymsMap.get(key).push({
    originalName: name,
    gender: gender.trim(),
    related: related
  });
}

console.log(`Loaded ${synonymsMap.size} unique names with synonym data`);

// Function to find matching synonyms for a name
function findRelatedNames(name, targetGender) {
  const key = name.toLowerCase();
  const entries = synonymsMap.get(key);

  if (!entries) return [];

  // Look for exact gender match first, then 'mf' entries
  let match = entries.find(e => e.gender === targetGender);
  if (!match) {
    match = entries.find(e => e.gender === 'mf');
  }

  return match ? match.related : [];
}

// Process boys.json
console.log('\nProcessing boys.json...');
const boysData = JSON.parse(fs.readFileSync(boysFile, 'utf-8'));
let boysWithSynonyms = 0;
let boysSynonymsTotal = 0;

for (const boy of boysData) {
  const related = findRelatedNames(boy.name, 'm');
  boy.relatedNames = related;
  if (related.length > 0) {
    boysWithSynonyms++;
    boysSynonymsTotal += related.length;
  }
}

fs.writeFileSync(boysFile, JSON.stringify(boysData, null, 2));
console.log(`✓ Updated ${boysData.length} boys' names`);
console.log(`  - ${boysWithSynonyms} names have synonyms (${boysSynonymsTotal} total synonyms)`);

// Process girls.json
console.log('\nProcessing girls.json...');
const girlsData = JSON.parse(fs.readFileSync(girlsFile, 'utf-8'));
let girlsWithSynonyms = 0;
let girlsSynonymsTotal = 0;

for (const girl of girlsData) {
  const related = findRelatedNames(girl.name, 'f');
  girl.relatedNames = related;
  if (related.length > 0) {
    girlsWithSynonyms++;
    girlsSynonymsTotal += related.length;
  }
}

fs.writeFileSync(girlsFile, JSON.stringify(girlsData, null, 2));
console.log(`✓ Updated ${girlsData.length} girls' names`);
console.log(`  - ${girlsWithSynonyms} names have synonyms (${girlsSynonymsTotal} total synonyms)`);

console.log('\n✅ Successfully added relatedNames to all name data!');
