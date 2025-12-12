const fs = require('fs');
const path = require('path');

// File paths
const boysFile = path.join(__dirname, '../data/boys.json');
const girlsFile = path.join(__dirname, '../data/girls.json');

console.log('Loading name data...');

// Read data files
const boysData = JSON.parse(fs.readFileSync(boysFile, 'utf-8'));
const girlsData = JSON.parse(fs.readFileSync(girlsFile, 'utf-8'));

console.log(`Loaded ${boysData.length} boys' names and ${girlsData.length} girls' names`);

// Create lookup map for quick access by name (case-insensitive)
const nameLookup = new Map();

// Add all boys to lookup
for (const boy of boysData) {
  const key = boy.name.toLowerCase();
  if (!nameLookup.has(key)) {
    nameLookup.set(key, []);
  }
  nameLookup.get(key).push({
    name: boy.name,
    rank: boy.rank,
    gender: 'Boy'
  });
}

// Add all girls to lookup
for (const girl of girlsData) {
  const key = girl.name.toLowerCase();
  if (!nameLookup.has(key)) {
    nameLookup.set(key, []);
  }
  nameLookup.get(key).push({
    name: girl.name,
    rank: girl.rank,
    gender: 'Girl'
  });
}

console.log(`Created lookup map with ${nameLookup.size} unique names`);

// Function to enrich related names with rank data
function enrichRelatedNames(relatedNames) {
  if (!relatedNames || relatedNames.length === 0) {
    return [];
  }

  const enriched = [];

  for (const relatedName of relatedNames) {
    const key = relatedName.toLowerCase();
    const entries = nameLookup.get(key);

    if (!entries) {
      // Related name not found in dataset, add without rank
      enriched.push({ name: relatedName, rank: null });
      continue;
    }

    // Add all gender variants (if name exists for both boys and girls)
    for (const entry of entries) {
      enriched.push({
        name: entry.name,
        rank: entry.rank,
        gender: entry.gender
      });
    }
  }

  return enriched;
}

// Process boys
console.log('\nProcessing boys\' names...');
let boysEnriched = 0;

for (const boy of boysData) {
  const enriched = enrichRelatedNames(boy.relatedNames);
  if (enriched.length > 0) {
    boy.relatedNamesWithRank = enriched;
    boysEnriched++;
  } else {
    boy.relatedNamesWithRank = [];
  }
}

console.log(`✓ Enriched ${boysEnriched} boys' names with rank data`);

// Process girls
console.log('\nProcessing girls\' names...');
let girlsEnriched = 0;

for (const girl of girlsData) {
  const enriched = enrichRelatedNames(girl.relatedNames);
  if (enriched.length > 0) {
    girl.relatedNamesWithRank = enriched;
    girlsEnriched++;
  } else {
    girl.relatedNamesWithRank = [];
  }
}

console.log(`✓ Enriched ${girlsEnriched} girls' names with rank data`);

// Write updated data back to files
console.log('\nWriting updated data files...');
fs.writeFileSync(boysFile, JSON.stringify(boysData, null, 2));
fs.writeFileSync(girlsFile, JSON.stringify(girlsData, null, 2));

console.log('\n✅ Successfully added rank data to all related names!');

// Show some examples
console.log('\n📊 Examples:');
const muhammad = boysData.find(n => n.name === 'Muhammad');
if (muhammad && muhammad.relatedNamesWithRank.length > 0) {
  console.log(`\nMuhammad related names (first 5):`);
  muhammad.relatedNamesWithRank.slice(0, 5).forEach(r => {
    console.log(`  ${r.name} (${r.gender}) - Rank: ${r.rank || 'unranked'}`);
  });
}

const aaron = boysData.find(n => n.name === 'Aaron');
if (aaron && aaron.relatedNamesWithRank.length > 0) {
  console.log(`\nAaron related names:`);
  aaron.relatedNamesWithRank.forEach(r => {
    console.log(`  ${r.name} (${r.gender}) - Rank: ${r.rank || 'unranked'}`);
  });
}
