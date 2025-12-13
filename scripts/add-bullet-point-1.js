#!/usr/bin/env node

/**
 * Add Bullet Point 1: Current Status
 *
 * Generates: "In 2024 {count} {gender} babies were named {name} making it the {rank} most popular {gender}'s name"
 */

const fs = require('fs');
const path = require('path');

const BOYS_FILE = path.join(__dirname, '../data/boys.json');
const GIRLS_FILE = path.join(__dirname, '../data/girls.json');

function addBulletPoint1(names) {
  let updated = 0;

  names.forEach(nameData => {
    const { name, rank, count, gender } = nameData;

    if (!name || !rank || !count || !gender) {
      console.warn(`Skipping ${name || 'unknown'}: missing required data`);
      return;
    }

    const genderLower = gender.toLowerCase();
    const bulletPoint = `In 2024 ${count.toLocaleString()} ${genderLower} babies were named ${name} making it the ${getRankWithSuffix(rank)} most popular ${genderLower}'s name`;

    nameData.bulletPoint1 = bulletPoint;
    updated++;
  });

  return updated;
}

function getRankWithSuffix(rank) {
  const rankNum = parseInt(rank);

  // Special cases for 11, 12, 13
  if (rankNum % 100 >= 11 && rankNum % 100 <= 13) {
    return rankNum + 'th';
  }

  // Regular cases
  const lastDigit = rankNum % 10;
  switch (lastDigit) {
    case 1:
      return rankNum + 'st';
    case 2:
      return rankNum + 'nd';
    case 3:
      return rankNum + 'rd';
    default:
      return rankNum + 'th';
  }
}

function processFile(filePath, genderName) {
  console.log(`\nProcessing ${genderName}...`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updated = addBulletPoint1(data);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✓ Added bullet point 1 to ${updated} ${genderName.toLowerCase()} names`);
}

// Main execution
console.log('Adding Bullet Point 1: Current Status\n' + '='.repeat(50));

processFile(BOYS_FILE, 'Boys');
processFile(GIRLS_FILE, 'Girls');

console.log('\n' + '='.repeat(50));
console.log('✓ Bullet Point 1 generation complete!');
