#!/usr/bin/env node

/**
 * Add Bullet Point 3: 20-Year Trend
 *
 * Analyzes the past 20 years (2005-2024) from rankFrom1996 and picks the most appropriate pattern:
 * 1) maintained a steady ranking
 * 2) jumped around erratically
 * 3) steadily gained popularity
 * 4) steadily declined in popularity
 * 5) gained in popularity then declined
 * 6) dropped in popularity then regained
 * 7) cycled in and out of fashion
 */

const fs = require('fs');
const path = require('path');

const BOYS_FILE = path.join(__dirname, '../data/boys.json');
const GIRLS_FILE = path.join(__dirname, '../data/girls.json');

function analyze20YearTrend(name, rankFrom1996) {
  // Get last 20 years (indices 9-28 = years 2005-2024)
  const last20Years = rankFrom1996.slice(9, 29);
  const startYear = 2005;

  // Convert to numbers, keep track of indices
  const dataPoints = last20Years
    .map((r, i) => ({
      rank: r === 'x' ? null : parseInt(r),
      year: startYear + i,
      index: i
    }))
    .filter(d => d.rank !== null);

  if (dataPoints.length < 5) {
    return `Over the past 20 years ${name} has had limited ranking data`;
  }

  const ranks = dataPoints.map(d => d.rank);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);
  const minYear = dataPoints.find(d => d.rank === minRank).year;
  const maxYear = dataPoints.find(d => d.rank === maxRank).year;

  const firstRank = dataPoints[0].rank;
  const lastRank = dataPoints[dataPoints.length - 1].rank;
  const range = maxRank - minRank;

  // Calculate volatility (standard deviation of changes)
  const changes = [];
  for (let i = 1; i < dataPoints.length; i++) {
    changes.push(Math.abs(dataPoints[i].rank - dataPoints[i - 1].rank));
  }
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;

  // Find peak (best rank, lowest number)
  const peakIndex = dataPoints.findIndex(d => d.rank === minRank);

  // Pattern detection
  // 1) Steady ranking - low range and low volatility
  if (range <= 50 && avgChange <= 10) {
    return `Over the past 20 years ${name} has maintained a steady ranking between #${minRank} in ${minYear} and #${maxRank} in ${maxYear}`;
  }

  // 2) Erratic - high volatility with no clear trend
  if (avgChange > 40) {
    return `Over the past 20 years ${name} has jumped around erratically between #${minRank} in ${minYear} and #${maxRank} in ${maxYear}`;
  }

  // 3) Steadily gained - consistent improvement (rank decreased)
  const overallChange = firstRank - lastRank;
  if (overallChange > 100 && lastRank < firstRank * 0.7) {
    return `Over the past 20 years ${name} has steadily gained popularity from #${firstRank} in ${startYear} to #${lastRank} in 2024`;
  }

  // 4) Steadily declined - consistent decline (rank increased)
  if (overallChange < -100 && lastRank > firstRank * 1.5) {
    return `Over the past 20 years ${name} has steadily declined in popularity from #${firstRank} in ${startYear} to #${lastRank} in 2024`;
  }

  // 5) Gained then declined - peak in middle/early, now worse
  if (peakIndex < dataPoints.length * 0.6 && lastRank > minRank * 1.5) {
    return `Over the past 20 years ${name} gained in popularity to #${minRank} in ${minYear} but has since declined to #${lastRank} in 2024`;
  }

  // 6) Dropped then regained - valley in middle/early, now better
  const valleyIndex = dataPoints.findIndex(d => d.rank === maxRank);
  if (valleyIndex < dataPoints.length * 0.6 && lastRank < maxRank * 0.7) {
    return `Over the past 20 years ${name} dropped in popularity to #${maxRank} in ${maxYear} but has since regained popularity to #${lastRank} in 2024`;
  }

  // 7) Cycled - default for other patterns with significant range
  return `Over the past 20 years ${name} has cycled in and out of fashion achieving a peak of #${minRank} in ${minYear} and a low of #${maxRank} in ${maxYear}`;
}

function addBulletPoint3(names) {
  let updated = 0;

  names.forEach(nameData => {
    const { name, rankFrom1996 } = nameData;

    if (!name || !rankFrom1996 || rankFrom1996.length < 29) {
      console.warn(`Skipping ${name || 'unknown'}: missing rankFrom1996 data`);
      return;
    }

    const bulletPoint = analyze20YearTrend(name, rankFrom1996);
    nameData.bulletPoint3 = bulletPoint;
    updated++;
  });

  return updated;
}

function processFile(filePath, genderName) {
  console.log(`\nProcessing ${genderName}...`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updated = addBulletPoint3(data);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✓ Added bullet point 3 to ${updated} ${genderName.toLowerCase()} names`);
}

// Main execution
console.log('Adding Bullet Point 3: 20-Year Trend\n' + '='.repeat(50));

processFile(BOYS_FILE, 'Boys');
processFile(GIRLS_FILE, 'Girls');

console.log('\n' + '='.repeat(50));
console.log('✓ Bullet Point 3 generation complete!');
