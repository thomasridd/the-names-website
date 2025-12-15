#!/usr/bin/env node

/**
 * Update Historic Classifications from Archetypes
 *
 * Updates the historicClassification field in boys.json and girls.json
 * using the archetype labels from name_archetypes.csv
 */

const fs = require('fs');
const path = require('path');

const ARCHETYPES_CSV = path.join(__dirname, '../analysis_output/name_archetypes.csv');
const BOYS_FILE = path.join(__dirname, '../data/boys.json');
const GIRLS_FILE = path.join(__dirname, '../data/girls.json');

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const header = lines[0].split(',');

  const archetypeMap = new Map();

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const name = values[0];
    const gender = values[1];
    const archetype = values[2];

    // Create a key combining name and gender
    const key = `${name}|${gender}`;
    archetypeMap.set(key, archetype);
  }

  return archetypeMap;
}

function updateJSON(filePath, gender, archetypeMap) {
  console.log(`\nProcessing ${path.basename(filePath)}...`);

  // Read JSON file
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`  Loaded ${data.length} names`);

  let updatedCount = 0;
  let unchangedCount = 0;

  // Update each name
  data.forEach(nameData => {
    const key = `${nameData.name}|${gender}`;

    if (archetypeMap.has(key)) {
      const archetype = archetypeMap.get(key);

      // Update the historicClassification field
      nameData.historicClassification = archetype;
      updatedCount++;
    } else {
      // Keep existing classification if no archetype found
      unchangedCount++;
    }
  });

  // Write updated JSON back to file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`  ✓ Updated ${updatedCount} names with new archetypes`);
  console.log(`  ✓ Kept existing classification for ${unchangedCount} names`);

  return { updated: updatedCount, unchanged: unchangedCount };
}

function main() {
  console.log('================================================================================');
  console.log('UPDATE HISTORIC CLASSIFICATIONS FROM ARCHETYPES');
  console.log('================================================================================');

  // Check if archetype CSV exists
  if (!fs.existsSync(ARCHETYPES_CSV)) {
    console.error(`\nError: ${ARCHETYPES_CSV} not found!`);
    console.error('Please run analyze_historic_features.py first.');
    process.exit(1);
  }

  // Read and parse archetype CSV
  console.log('\nReading archetype assignments...');
  const csvContent = fs.readFileSync(ARCHETYPES_CSV, 'utf8');
  const archetypeMap = parseCSV(csvContent);
  console.log(`  Loaded ${archetypeMap.size} archetype assignments`);

  // Update boys.json
  const boysStats = updateJSON(BOYS_FILE, 'Boy', archetypeMap);

  // Update girls.json
  const girlsStats = updateJSON(GIRLS_FILE, 'Girl', archetypeMap);

  // Summary
  console.log('\n================================================================================');
  console.log('UPDATE COMPLETE');
  console.log('================================================================================');
  console.log(`\nTotal names updated: ${boysStats.updated + girlsStats.updated}`);
  console.log(`Total names unchanged: ${boysStats.unchanged + girlsStats.unchanged}`);
  console.log('\nUpdated files:');
  console.log(`  - ${BOYS_FILE}`);
  console.log(`  - ${GIRLS_FILE}`);
}

// Main execution
main();
