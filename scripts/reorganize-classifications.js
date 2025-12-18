const fs = require('fs');
const path = require('path');

const boysJsonPath = path.join(__dirname, '../data/boys.json');
const girlsJsonPath = path.join(__dirname, '../data/girls.json');

// Function to reorganize classifications in a JSON file
function reorganizeClassifications(filePath, gender) {
  console.log(`\nProcessing ${gender} names...`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updatedCount = 0;

  data.forEach(nameData => {
    // Ensure classifications object exists
    if (!nameData.classifications) {
      nameData.classifications = {};
    }

    // Move historicClassification to classifications.historic
    if (nameData.historicClassification) {
      nameData.classifications.historic = nameData.historicClassification;
      delete nameData.historicClassification;
    }

    // Move recentClassification to classifications.recent
    if (nameData.recentClassification) {
      nameData.classifications.recent = nameData.recentClassification;
      delete nameData.recentClassification;
    }

    updatedCount++;
  });

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

  console.log(`  Updated: ${updatedCount} names`);
  console.log(`  Total: ${data.length} names`);
}

// Update both files
reorganizeClassifications(boysJsonPath, 'boys');
reorganizeClassifications(girlsJsonPath, 'girls');

console.log('\n✓ Successfully reorganized classifications in both JSON files');
console.log('  - historicClassification → classifications.historic');
console.log('  - recentClassification → classifications.recent');
console.log('  - five_year remains at classifications.five_year');
