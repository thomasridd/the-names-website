#!/usr/bin/env node

/**
 * Add Bullet Point 2: 5-Year Trend
 *
 * Generates:
 * - "Since 2020 {name} has {rapidly, slightly} gained popularity at a rate of {slope} extra births per year"
 * - "Since 2020 {name} has {rapidly, slightly} decreased in popularity at a rate of {slope} fewer births per year"
 * - "Since 2020 {name} has roughly maintained popularity between {min} and {max} births per year"
 * - "{name} is a very rare name and in recent years has been missing from the statistics" (2+ missing years)
 *
 * Based on the last 5 years from countFrom1996 (2020-2024)
 * Uses linear regression on baby counts with r-squared to determine trend strength
 * Dynamic thresholds: rapidly = 10% of average, slightly = 5% of average
 */

const fs = require('fs');
const path = require('path');

const BOYS_FILE = path.join(__dirname, '../data/boys.json');
const GIRLS_FILE = path.join(__dirname, '../data/girls.json');

/**
 * Calculate linear regression and r-squared
 * Returns { slope, rSquared, validCount }
 */
function linearRegression(points) {
  const n = points.length;

  if (n < 2) {
    return { slope: 0, rSquared: 0, validCount: n };
  }

  // Calculate means
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;

  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;

  for (const point of points) {
    numerator += (point.x - meanX) * (point.y - meanY);
    denominator += (point.x - meanX) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Calculate r-squared
  let ssTotal = 0;
  let ssResidual = 0;

  for (const point of points) {
    const predicted = slope * point.x + intercept;
    ssTotal += (point.y - meanY) ** 2;
    ssResidual += (point.y - predicted) ** 2;
  }

  const rSquared = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);

  return { slope, rSquared, validCount: n };
}

function analyze5YearTrend(countFrom1996) {
  // Get last 5 years (indices 24-28 = years 2020-2024)
  const last5Years = countFrom1996.slice(-5);
  const startYear = 2020;

  // Check for missing data points
  const missingCount = last5Years.filter(c => c === 'x').length;

  if (missingCount >= 2) {
    return { type: 'rare', missingCount };
  }

  // Convert to points for regression (x = year index, y = count)
  const points = last5Years
    .map((c, i) => ({ x: i, y: c === 'x' ? null : parseInt(c), year: startYear + i }))
    .filter(p => p.y !== null);

  if (points.length < 2) {
    return { type: 'maintaining', slope: 0, rSquared: 0 };
  }

  const { slope, rSquared, validCount } = linearRegression(points);

  // Find high and low counts with their years
  let maxCount = points[0];
  let minCount = points[0];

  for (const point of points) {
    if (point.y > maxCount.y) maxCount = point;
    if (point.y < minCount.y) minCount = point;
  }

  // Calculate average count to determine dynamic thresholds
  const avgCount = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const rapidThreshold = avgCount * 0.10; // 10% of average
  const slowThreshold = avgCount * 0.05;  // 5% of average

  // Positive slope = count increasing = gaining popularity (more babies)
  // Negative slope = count decreasing = losing popularity (fewer babies)

  // Use r-squared to determine confidence
  // Higher r-squared (> 0.5) means clear trend
  // Lower r-squared means volatile/maintaining

  let type;

  if (rSquared < 0.3) {
    // Low r-squared = no clear trend
    type = 'maintaining';
  } else if (slope > rapidThreshold) {
    // Strong positive slope with good fit = rapidly gaining
    type = 'rapidly gaining';
  } else if (slope > slowThreshold) {
    // Moderate positive slope with good fit = slowly gaining
    type = 'slowly gaining';
  } else if (slope < -rapidThreshold) {
    // Strong negative slope with good fit = rapidly losing
    type = 'rapidly losing';
  } else if (slope < -slowThreshold) {
    // Moderate negative slope with good fit = slowly losing
    type = 'slowly losing';
  } else {
    // Small slope = maintaining
    type = 'maintaining';
  }

  return {
    type,
    slope,
    rSquared,
    validCount,
    maxCount: maxCount.y,
    maxYear: maxCount.year,
    minCount: minCount.y,
    minYear: minCount.year
  };
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
    } else if (result.type === 'rapidly gaining' || result.type === 'slowly gaining') {
      // Round slope to integer
      const slopeInt = Math.round(Math.abs(result.slope));
      const intensity = result.type === 'rapidly gaining' ? 'rapidly' : 'slightly';

      bulletPoint = `Since 2020 ${name} has ${intensity} gained popularity at a rate of ${slopeInt} extra births per year`;
      gainedCount++;
    } else if (result.type === 'rapidly losing' || result.type === 'slowly losing') {
      // Round slope to integer (use absolute value)
      const slopeInt = Math.round(Math.abs(result.slope));
      const intensity = result.type === 'rapidly losing' ? 'rapidly' : 'slightly';

      bulletPoint = `Since 2020 ${name} has ${intensity} decreased in popularity at a rate of ${slopeInt} fewer births per year`;
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
