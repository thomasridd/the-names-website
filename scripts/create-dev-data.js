#!/usr/bin/env node

/**
 * Create dev versions of data files with only top 500 names
 * This speeds up development builds significantly
 *
 * Usage: node scripts/create-dev-data.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TOP_N = 500;

function createDevData(filename) {
  const inputPath = path.join(DATA_DIR, filename);
  const outputFilename = filename.replace('.json', '-dev.json');
  const outputPath = path.join(DATA_DIR, outputFilename);

  console.log(`Reading ${filename}...`);

  // Read the full data file
  const fullData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  // Take only the top N names (already sorted by rank)
  const devData = fullData.slice(0, TOP_N);

  // Write to dev file
  fs.writeFileSync(outputPath, JSON.stringify(devData, null, 2));

  const originalSize = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(2);
  const devSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);

  console.log(`✓ Created ${outputFilename}`);
  console.log(`  Original: ${fullData.length} names (${originalSize} MB)`);
  console.log(`  Dev:      ${devData.length} names (${devSize} MB)`);
  console.log(`  Reduction: ${((1 - devSize / originalSize) * 100).toFixed(1)}%`);
  console.log();
}

console.log('Creating dev data files with top 500 names...\n');

try {
  createDevData('boys.json');
  createDevData('girls.json');

  console.log('✅ Dev data files created successfully!');
  console.log('\nTo use dev data in development:');
  console.log('  1. Update .eleventy.js to use boys-dev.json and girls-dev.json');
  console.log('  2. Or create a separate .eleventy.dev.js config');
  console.log('  3. Run npm run dev with the dev data');
  console.log('\nNote: These files are gitignored and for local development only.');

} catch (error) {
  console.error('❌ Error creating dev data files:', error.message);
  process.exit(1);
}
