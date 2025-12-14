#!/usr/bin/env node

/**
 * Extract Rank Historic Time Series CSV
 *
 * Creates a CSV file with columns: name|gender, 1910s, 1920s, ..., 2020s
 * Uses rankHistoric data and leaves 'x' values as is
 */

const fs = require('fs');
const path = require('path');

const BOYS_FILE = path.join(__dirname, '../data/boys.json');
const GIRLS_FILE = path.join(__dirname, '../data/girls.json');
const OUTPUT_FILE = path.join(__dirname, '../data/rankHistoricTimeSeries.csv');

function extractTimeSeries() {
  console.log('Extracting rank historic time series data...\n');

  // Read both JSON files
  const boys = JSON.parse(fs.readFileSync(BOYS_FILE, 'utf8'));
  const girls = JSON.parse(fs.readFileSync(GIRLS_FILE, 'utf8'));

  console.log(`Loaded ${boys.length} boys names`);
  console.log(`Loaded ${girls.length} girls names`);

  // Create CSV header - 13 decades from 1900s to 2020s
  // Note: Data array has 13 values covering 1904-2024 in decade buckets
  const decades = ['1900s', '1910s', '1920s', '1930s', '1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

  const header = 'name|gender,' + decades.join(',');
  const rows = [header];

  // Process boys
  boys.forEach(nameData => {
    if (!nameData.rankHistoric || nameData.rankHistoric.length !== 13) {
      return; // Skip if data is missing
    }

    // Keep 'x' as is - no conversion needed
    const ranks = nameData.rankHistoric;
    const row = `${nameData.name}|Boy,${ranks.join(',')}`;
    rows.push(row);
  });

  // Process girls
  girls.forEach(nameData => {
    if (!nameData.rankHistoric || nameData.rankHistoric.length !== 13) {
      return; // Skip if data is missing
    }

    // Keep 'x' as is - no conversion needed
    const ranks = nameData.rankHistoric;
    const row = `${nameData.name}|Girl,${ranks.join(',')}`;
    rows.push(row);
  });

  // Write CSV file
  const csv = rows.join('\n');
  fs.writeFileSync(OUTPUT_FILE, csv);

  console.log(`\n✓ Created ${OUTPUT_FILE}`);
  console.log(`  Total rows: ${rows.length - 1} (excluding header)`);
  console.log(`  Columns: name|gender + ${decades.length} decade columns (${decades[0]}-${decades[decades.length - 1]})`);
}

// Main execution
extractTimeSeries();
