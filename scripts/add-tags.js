const fs = require('fs');
const path = require('path');

// File paths
const boysFile = path.join(__dirname, '..', 'data', 'boys.json');
const girlsFile = path.join(__dirname, '..', 'data', 'girls.json');
const boysDevFile = path.join(__dirname, '..', 'data', 'boys-dev.json');
const girlsDevFile = path.join(__dirname, '..', 'data', 'girls-dev.json');

/**
 * Add tags to each name based on historic-profile popularity values
 * @param {Array} names - Array of name objects
 * @returns {Array} - Names with tags added
 */
function addTagsToNames(names) {
  return names.map(name => {
    const tags = [];

    // Check if historic-profile exists
    if (!name['historic-profile']) {
      name.tags = tags;
      return name;
    }

    const earlyPopularity = name['historic-profile']['1-early-century']?.popularity || 0;
    const midPopularity = name['historic-profile']['2-mid-century']?.popularity || 0;
    const endPopularity = name['historic-profile']['3-end-century']?.popularity || 0;
    const recentPopularity = name['historic-profile']['4-recent']?.popularity || 0;

    // "Early 20th century" - must have >0 for early and 0 for all other eras
    if (earlyPopularity > 0 && midPopularity === 0 && endPopularity === 0 && recentPopularity === 0) {
      tags.push("Early 20th century");
    }

    // "Booming" - must have >0 for mid-century and 0 for all other eras
    if (midPopularity > 0 && earlyPopularity === 0 && endPopularity === 0 && recentPopularity === 0) {
      tags.push("Booming");
    }

    // "Millenial" - must have >0 for end-century and 0 for all other eras
    if (endPopularity > 0 && earlyPopularity === 0 && midPopularity === 0 && recentPopularity === 0) {
      tags.push("Millenial");
    }

    // "Modern era" - must have >0 for recent and 0 for all other eras
    if (recentPopularity > 0 && earlyPopularity === 0 && midPopularity === 0 && endPopularity === 0) {
      tags.push("Modern era");
    }

    // "Vintage revival" - must have >0 for early, >0 for recent, and 0 for mid and end
    if (earlyPopularity > 0 && recentPopularity > 0 && midPopularity === 0 && endPopularity === 0) {
      tags.push("Vintage revival");
    }

    name.tags = tags;
    return name;
  });
}

/**
 * Process a data file to add tags
 * @param {string} filePath - Path to the JSON file
 * @returns {boolean} - True if file was processed, false if not found
 */
function processFile(filePath) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`\nSkipping ${path.basename(filePath)} (not found)`);
    return false;
  }

  console.log(`\nProcessing ${path.basename(filePath)}...`);

  // Read the file
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Loaded ${data.length} names`);

  // Add tags
  const updatedData = addTagsToNames(data);

  // Calculate statistics
  const stats = {
    earlyCount: 0,
    boomingCount: 0,
    millenialCount: 0,
    modernCount: 0,
    vintageCount: 0,
    noTags: 0
  };

  updatedData.forEach(name => {
    if (name.tags.length === 0) {
      stats.noTags++;
    }
    if (name.tags.includes("Early 20th century")) {
      stats.earlyCount++;
    }
    if (name.tags.includes("Booming")) {
      stats.boomingCount++;
    }
    if (name.tags.includes("Millenial")) {
      stats.millenialCount++;
    }
    if (name.tags.includes("Modern era")) {
      stats.modernCount++;
    }
    if (name.tags.includes("Vintage revival")) {
      stats.vintageCount++;
    }
  });

  console.log(`\nTag Statistics:`);
  console.log(`  Early 20th century: ${stats.earlyCount}`);
  console.log(`  Booming: ${stats.boomingCount}`);
  console.log(`  Millenial: ${stats.millenialCount}`);
  console.log(`  Modern era: ${stats.modernCount}`);
  console.log(`  Vintage revival: ${stats.vintageCount}`);
  console.log(`  No tags: ${stats.noTags}`);

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
  console.log(`✓ Updated ${path.basename(filePath)}`);
  return true;
}

// Main execution
console.log('Adding tags to name data files...');
console.log('=====================================');

// Process production files
processFile(boysFile);
processFile(girlsFile);

// Process dev files (if they exist)
processFile(boysDevFile);
processFile(girlsDevFile);

console.log('\n=====================================');
console.log('✓ Tags added successfully to all files');
