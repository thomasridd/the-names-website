const fs = require('fs');
const path = require('path');

// Read the archetype data from the since_2020 analysis
const archetypeCsvPath = path.join(__dirname, '../analysis_output/since_2020/features_with_clusters.csv');
const boysJsonPath = path.join(__dirname, '../data/boys.json');
const girlsJsonPath = path.join(__dirname, '../data/girls.json');

console.log('Reading archetype data from since_2020 analysis...');

// Parse CSV file
const csvContent = fs.readFileSync(archetypeCsvPath, 'utf8');
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

// Find the archetype column index
const archetypeIndex = headers.indexOf('archetype');
const nameIndex = headers.indexOf('name');

if (archetypeIndex === -1 || nameIndex === -1) {
  console.error('Could not find required columns in CSV');
  process.exit(1);
}

// Create a map of name -> archetype
const archetypeMap = new Map();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const columns = line.split(',');
  const name = columns[nameIndex];
  const archetype = columns[archetypeIndex];

  if (name && archetype) {
    archetypeMap.set(name, archetype);
  }
}

console.log(`Loaded ${archetypeMap.size} name-archetype mappings`);

// Function to update JSON file
function updateJsonFile(filePath, gender) {
  console.log(`\nProcessing ${gender} names...`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updatedCount = 0;
  let notFoundCount = 0;

  data.forEach(nameData => {
    const archetype = archetypeMap.get(nameData.name);

    if (archetype) {
      // Add or update the classifications object
      if (!nameData.classifications) {
        nameData.classifications = {};
      }
      nameData.classifications.five_year = archetype;
      updatedCount++;
    } else {
      // Set as Unknown if not found in archetype map
      if (!nameData.classifications) {
        nameData.classifications = {};
      }
      nameData.classifications.five_year = 'Unknown';
      notFoundCount++;
    }
  });

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

  console.log(`  Updated: ${updatedCount} names`);
  console.log(`  Not found (set to Unknown): ${notFoundCount} names`);
  console.log(`  Total: ${data.length} names`);
}

// Update both files
updateJsonFile(boysJsonPath, 'boys');
updateJsonFile(girlsJsonPath, 'girls');

console.log('\n✓ Successfully added five_year classifications to both JSON files');
