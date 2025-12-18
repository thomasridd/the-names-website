#!/usr/bin/env node

/**
 * Add Bullet Point 2: 5-Year Trend
 *
 * Generates:
 * - "Since 2020 {name} has gained popularity by {percent}%"
 * - "Since 2020 {name} has decreased in popularity by {percent}%"
 * - "Since 2020 {name} has roughly maintained popularity between {min} and {max} births per year"
 * - "{name} is a very rare name and in recent years has been missing from the statistics" (2+ missing years)
 *
 * Based on the last 5 years from countFrom1996 (2020-2024)
 * Calculates percentage change from 2020 to 2024
 */

const fs = require('fs');
const path = require('path');

const BOYS_FILE = path.join(__dirname, '../data/boys.json');
const GIRLS_FILE = path.join(__dirname, '../data/girls.json');

function analyze5YearTrend(countFrom1996) {
  // Get last 5 years (indices 24-28 = years 2020-2024)
  const last5Years = countFrom1996.slice(-5);
  const startYear = 2020;

  // Check for missing data points
  const missingCount = last5Years.filter(c => c === 'x').length;

  if (missingCount >= 2) {
    return { type: 'rare', missingCount };
  }

  // Get 2020 and 2024 counts
  const count2020 = last5Years[0]; // Index 0 = 2020
  const count2024 = last5Years[4]; // Index 4 = 2024

  // If either 2020 or 2024 is missing, fall back to maintaining with range
  if (count2020 === 'x' || count2024 === 'x') {
    const validCounts = last5Years
      .filter(c => c !== 'x')
      .map(c => parseInt(c));

    if (validCounts.length === 0) {
      return { type: 'rare', missingCount: 5 };
    }

    const maxCount = Math.max(...validCounts);
    const minCount = Math.min(...validCounts);

    return {
      type: 'maintaining',
      maxCount,
      minCount
    };
  }

  const count2020Int = parseInt(count2020);
  const count2024Int = parseInt(count2024);

  // Calculate percentage change
  // Percentage change = ((new - old) / old) * 100
  const percentChange = ((count2024Int - count2020Int) / count2020Int) * 100;

  // Determine type based on percentage change
  // Maintaining: ±5% or less
  // Gaining/Losing: >5%
  const threshold = 5;

  if (Math.abs(percentChange) <= threshold) {
    // Get all valid counts to show range
    const validCounts = last5Years
      .filter(c => c !== 'x')
      .map(c => parseInt(c));

    const maxCount = Math.max(...validCounts);
    const minCount = Math.min(...validCounts);

    return {
      type: 'maintaining',
      maxCount,
      minCount,
      percentChange
    };
  } else if (percentChange > 0) {
    return {
      type: 'gained',
      percentChange,
      count2020: count2020Int,
      count2024: count2024Int
    };
  } else {
    return {
      type: 'lost',
      percentChange: Math.abs(percentChange), // Use absolute value for display
      count2020: count2020Int,
      count2024: count2024Int
    };
  }
}

function addBulletPoint2(names) {
  let updated = 0;
  let rareCount = 0;
  let gainedCount = 0;
  let lostCount = 0;
  let maintainedCount = 0;

  names.forEach(nameData => {
    const { name, countFrom1996 } = nameData;

    if (!name || !countFrom1996 || countFrom1996.length < 29) {
      console.warn(`Skipping ${name || 'unknown'}: missing countFrom1996 data`);
      return;
    }

    const result = analyze5YearTrend(countFrom1996);
    let bulletPoint;

    if (result.type === 'rare') {
      bulletPoint = `${name} is a very rare name and in recent years has been missing from the statistics`;
      rareCount++;
    } else if (result.type === 'maintaining') {
      // Format counts with commas
      const maxCountFormatted = result.maxCount.toLocaleString();
      const minCountFormatted = result.minCount.toLocaleString();

      bulletPoint = `Since 2020 ${name} has roughly maintained popularity between ${minCountFormatted} and ${maxCountFormatted} births per year`;
      maintainedCount++;
    } else if (result.type === 'gained') {
      // Round percentage to whole number
      const percentRounded = Math.round(result.percentChange);

      bulletPoint = `Since 2020 ${name} has gained popularity by ${percentRounded}%`;
      gainedCount++;
    } else if (result.type === 'lost') {
      // Round percentage to whole number (already absolute value)
      const percentRounded = Math.round(result.percentChange);

      bulletPoint = `Since 2020 ${name} has decreased in popularity by ${percentRounded}%`;
      lostCount++;
    }

    nameData.bulletPoint2 = bulletPoint;
    updated++;
  });

  console.log(`  - ${rareCount} rare names with missing data`);
  console.log(`  - ${gainedCount} names gaining popularity`);
  console.log(`  - ${lostCount} names losing popularity`);
  console.log(`  - ${maintainedCount} names maintaining popularity`);
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
