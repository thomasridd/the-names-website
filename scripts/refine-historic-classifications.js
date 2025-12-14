#!/usr/bin/env node

/**
 * Refine Historic Classifications
 *
 * Updates historicClassification based on 2020s ranking data:
 * - "Intermittent Presence" + 2020s ranked → "Vintage Revival"
 * - "Intermittent Presence" + 2020s unranked → "Pendulum"
 * - "Steady Classic" + 2020s unranked → "Fallen Classic"
 */

const fs = require('fs');
const path = require('path');

const BOYS_FILE = path.join(__dirname, '../data/boys.json');
const GIRLS_FILE = path.join(__dirname, '../data/girls.json');

function refineClassifications(filePath, gender) {
  console.log(`\nProcessing ${path.basename(filePath)}...`);

  // Read JSON file
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`  Loaded ${data.length} names`);

  let intermittentToVintage = 0;
  let intermittentToPendulum = 0;
  let steadyToFallen = 0;
  let steadyRemained = 0;

  // Update each name
  data.forEach(nameData => {
    const historicClass = nameData.historicClassification;

    // rankHistoric has 13 values: 1900s, 1910s, ..., 2020s
    // Index 12 is the 2020s value
    const rank2020s = nameData.rankHistoric && nameData.rankHistoric[12];

    if (historicClass === 'Intermittent Presence') {
      if (rank2020s && rank2020s !== 'x') {
        // Present in 2020s top 100 → Vintage Revival
        nameData.historicClassification = 'Vintage Revival';
        intermittentToVintage++;
      } else {
        // Not in 2020s top 100 → Pendulum
        nameData.historicClassification = 'Pendulum';
        intermittentToPendulum++;
      }
    } else if (historicClass === 'Steady Classic') {
      if (rank2020s === 'x' || !rank2020s) {
        // Not in 2020s top 100 → Fallen Classic
        nameData.historicClassification = 'Fallen Classic';
        steadyToFallen++;
      } else {
        // Still in 2020s top 100 → Remains Steady Classic
        steadyRemained++;
      }
    }
  });

  // Write updated JSON back to file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`  ✓ Intermittent Presence → Vintage Revival: ${intermittentToVintage}`);
  console.log(`  ✓ Intermittent Presence → Pendulum: ${intermittentToPendulum}`);
  console.log(`  ✓ Steady Classic → Fallen Classic: ${steadyToFallen}`);
  console.log(`  ✓ Steady Classic (unchanged): ${steadyRemained}`);

  return {
    intermittentToVintage,
    intermittentToPendulum,
    steadyToFallen,
    steadyRemained
  };
}

function main() {
  console.log('================================================================================');
  console.log('REFINE HISTORIC CLASSIFICATIONS');
  console.log('================================================================================');

  // Update boys.json
  const boysStats = refineClassifications(BOYS_FILE, 'Boy');

  // Update girls.json
  const girlsStats = refineClassifications(GIRLS_FILE, 'Girl');

  // Summary
  console.log('\n================================================================================');
  console.log('UPDATE COMPLETE');
  console.log('================================================================================');
  console.log('\nTotal changes:');
  console.log(`  Intermittent Presence → Vintage Revival: ${boysStats.intermittentToVintage + girlsStats.intermittentToVintage}`);
  console.log(`  Intermittent Presence → Pendulum: ${boysStats.intermittentToPendulum + girlsStats.intermittentToPendulum}`);
  console.log(`  Steady Classic → Fallen Classic: ${boysStats.steadyToFallen + girlsStats.steadyToFallen}`);
  console.log(`  Steady Classic (unchanged): ${boysStats.steadyRemained + girlsStats.steadyRemained}`);
  console.log('\nUpdated files:');
  console.log(`  - ${BOYS_FILE}`);
  console.log(`  - ${GIRLS_FILE}`);
}

// Main execution
main();
