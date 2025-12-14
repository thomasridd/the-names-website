#!/usr/bin/env node

/**
 * Extract Count Time Series CSV
 *
 * Creates a CSV file with columns: name|gender, 1996, 1997, ..., 2024
 * Uses countFrom1996 data and substitutes 0 for 'x' values
 */

const fs = require('fs');
const path = require('path');

const BOYS_FILE = path.join(__dirname, '../data/boys.json');
const GIRLS_FILE = path.join(__dirname, '../data/girls.json');
const OUTPUT_FILE = path.join(__dirname, '../data/countTimeSeries.csv');

function extractTimeSeries() {
  console.log('Extracting count time series data...\n');

  // Read both JSON files
  const boys = JSON.parse(fs.readFileSync(BOYS_FILE, 'utf8'));
  const girls = JSON.parse(fs.readFileSync(GIRLS_FILE, 'utf8'));

  console.log(`Loaded ${boys.length} boys names`);
  console.log(`Loaded ${girls.length} girls names`);

  // Create CSV header
  const startYear = 1996;
  const endYear = 2024;
  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }

  const header = 'name|gender,' + years.join(',');
  const rows = [header];

  // Process boys
  boys.forEach(nameData => {
    if (!nameData.countFrom1996 || nameData.countFrom1996.length !== 29) {
      return; // Skip if data is missing
    }

    const counts = nameData.countFrom1996.map(c => c === 'x' ? '0' : c);
    const row = `${nameData.name}|Boy,${counts.join(',')}`;
    rows.push(row);
  });

  // Process girls
  girls.forEach(nameData => {
    if (!nameData.countFrom1996 || nameData.countFrom1996.length !== 29) {
      return; // Skip if data is missing
    }

    const counts = nameData.countFrom1996.map(c => c === 'x' ? '0' : c);
    const row = `${nameData.name}|Girl,${counts.join(',')}`;
    rows.push(row);
  });

  // Write CSV file
  const csv = rows.join('\n');
  fs.writeFileSync(OUTPUT_FILE, csv);

  console.log(`\n✓ Created ${OUTPUT_FILE}`);
  console.log(`  Total rows: ${rows.length - 1} (excluding header)`);
  console.log(`  Columns: name|gender + ${years.length} year columns (${startYear}-${endYear})`);
}

// Main execution
extractTimeSeries();
