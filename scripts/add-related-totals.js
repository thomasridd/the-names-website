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
  nameLookup.get(key).push(boy);
}

// Add all girls to lookup
for (const girl of girlsData) {
  const key = girl.name.toLowerCase();
  if (!nameLookup.has(key)) {
    nameLookup.set(key, []);
  }
  nameLookup.get(key).push(girl);
}

console.log(`Created lookup map with ${nameLookup.size} unique names`);

// Function to calculate related totals for a name
function calculateRelatedTotals(nameData) {
  if (!nameData.relatedNames || nameData.relatedNames.length === 0) {
    // No related names, return array of zeros or 'x'
    return Array(29).fill('x');
  }

  // Initialize totals array with zeros
  const totals = Array(29).fill(0);
  let foundAnyData = false;

  // For each related name, add up their counts
  for (const relatedName of nameData.relatedNames) {
    const key = relatedName.toLowerCase();
    const relatedEntries = nameLookup.get(key);

    if (!relatedEntries) {
      // Related name not found in dataset
      continue;
    }

    // Could have multiple entries (same name for different genders)
    // Sum them all up
    for (const entry of relatedEntries) {
      if (!entry.countFrom1996) continue;

      for (let i = 0; i < 29; i++) {
        const count = entry.countFrom1996[i];
        if (count && count !== 'x') {
          const numericCount = parseInt(count);
          if (!isNaN(numericCount)) {
            totals[i] += numericCount;
            foundAnyData = true;
          }
        }
      }
    }
  }

  // If we found any data, convert zeros to 'x' for years with no data
  // Otherwise, return array of 'x'
  if (!foundAnyData) {
    return Array(29).fill('x');
  }

  // Convert zeros back to 'x' (no data for that year)
  return totals.map(val => val === 0 ? 'x' : val.toString());
}

// Process boys
console.log('\nProcessing boys\' names...');
let boysWithRelatedData = 0;

for (const boy of boysData) {
  boy.relatedTotalCountFrom1996 = calculateRelatedTotals(boy);

  // Check if this name has any related data (not all 'x')
  if (boy.relatedTotalCountFrom1996.some(val => val !== 'x')) {
    boysWithRelatedData++;
  }
}

console.log(`✓ Added relatedTotalCountFrom1996 to ${boysData.length} boys' names`);
console.log(`  - ${boysWithRelatedData} have related name count data`);

// Process girls
console.log('\nProcessing girls\' names...');
let girlsWithRelatedData = 0;

for (const girl of girlsData) {
  girl.relatedTotalCountFrom1996 = calculateRelatedTotals(girl);

  // Check if this name has any related data (not all 'x')
  if (girl.relatedTotalCountFrom1996.some(val => val !== 'x')) {
    girlsWithRelatedData++;
  }
}

console.log(`✓ Added relatedTotalCountFrom1996 to ${girlsData.length} girls' names`);
console.log(`  - ${girlsWithRelatedData} have related name count data`);

// Write updated data back to files
console.log('\nWriting updated data files...');
fs.writeFileSync(boysFile, JSON.stringify(boysData, null, 2));
fs.writeFileSync(girlsFile, JSON.stringify(girlsData, null, 2));

console.log('\n✅ Successfully added relatedTotalCountFrom1996 to all names!');

// Show some examples
console.log('\n📊 Examples:');
const aaron = boysData.find(n => n.name === 'Aaron');
if (aaron) {
  console.log(`\nAaron (related names: ${aaron.relatedNames.join(', ')})`);
  console.log(`  2024 count: ${aaron.countFrom1996[28]}`);
  console.log(`  2024 related total: ${aaron.relatedTotalCountFrom1996[28]}`);
}

const muhammad = boysData.find(n => n.name === 'Muhammad');
if (muhammad) {
  console.log(`\nMuhammad (related names: ${muhammad.relatedNames.slice(0, 3).join(', ')}...)`);
  console.log(`  2024 count: ${muhammad.countFrom1996[28]}`);
  console.log(`  2024 related total: ${muhammad.relatedTotalCountFrom1996[28]}`);
}
