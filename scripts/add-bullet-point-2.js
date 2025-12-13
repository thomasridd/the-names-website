#!/usr/bin/env node

/**
 * Add Bullet Point 2: 5-Year Trend
 *
 * Generates: "{name} is currently {gaining, losing, maintaining} popularity"
 * Based on the last 5 years from rankFrom1996 (2020-2024)
 */

const fs = require('fs');
const path = require('path');

const BOYS_FILE = path.join(__dirname, '../data/boys.json');
const GIRLS_FILE = path.join(__dirname, '../data/girls.json');

function analyze5YearTrend(rankFrom1996) {
  // Get last 5 years (indices 24-28 = years 2020-2024)
  const last5Years = rankFrom1996.slice(-5);

  // Filter out 'x' values and convert to numbers
  const validRanks = last5Years
    .map((r, i) => ({ rank: r === 'x' ? null : parseInt(r), index: i }))
    .filter(d => d.rank !== null);

  if (validRanks.length < 2) {
    return 'maintaining';
  }

  const firstRank = validRanks[0].rank;
  const lastRank = validRanks[validRanks.length - 1].rank;

  // Lower rank number = more popular (rank 1 is best)
  const change = firstRank - lastRank;

  // Gaining popularity means rank number decreased (moved towards 1)
  if (change > 20) {
    return 'gaining';
  } else if (change < -20) {
    return 'losing';
  } else {
    return 'maintaining';
  }
}

function addBulletPoint2(names) {
  let updated = 0;

  names.forEach(nameData => {
    const { name, rankFrom1996 } = nameData;

    if (!name || !rankFrom1996 || rankFrom1996.length < 29) {
      console.warn(`Skipping ${name || 'unknown'}: missing rankFrom1996 data`);
      return;
    }

    const trend = analyze5YearTrend(rankFrom1996);
    const bulletPoint = `${name} is currently ${trend} popularity`;

    nameData.bulletPoint2 = bulletPoint;
    updated++;
  });

  return updated;
}

function processFile(filePath, genderName) {
  console.log(`\nProcessing ${genderName}...`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updated = addBulletPoint2(data);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✓ Added bullet point 2 to ${updated} ${genderName.toLowerCase()} names`);
}

// Main execution
console.log('Adding Bullet Point 2: 5-Year Trend\n' + '='.repeat(50));

processFile(BOYS_FILE, 'Boys');
processFile(GIRLS_FILE, 'Girls');

console.log('\n' + '='.repeat(50));
console.log('✓ Bullet Point 2 generation complete!');
