const fs = require('fs');
const path = require('path');

// Read the JSON data files
const boysData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/boys.json'), 'utf-8'));
const girlsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/girls.json'), 'utf-8'));

/**
 * Classification logic for RECENT patterns (1996-2024, 29 years of data)
 * Based on data/recent-classifications.txt
 */
function classifyRecent(name, rankArray) {
  // Convert rank strings to numbers, treat empty/null as unranked (999)
  const ranks = rankArray.map(r => {
    if (r === '' || r === null || r === 'x') return 999;
    const parsed = parseInt(r);
    return isNaN(parsed) ? 999 : parsed;
  });

  const totalYears = ranks.length; // Should be 29

  // Helper functions
  const rankedYears = ranks.filter(r => r < 999);
  const inTop100Count = ranks.filter(r => r <= 100).length;
  const inTop200Count = ranks.filter(r => r <= 200).length;
  const inTop500Count = ranks.filter(r => r <= 500).length;

  const minRank = rankedYears.length > 0 ? Math.min(...rankedYears) : 999;
  const maxRank = rankedYears.length > 0 ? Math.max(...rankedYears) : 999;

  const firstRank = ranks[0];
  const lastRank = ranks[ranks.length - 1];

  // Split into periods
  const early = ranks.slice(0, 10); // 1996-2005 (first 10 years)
  const middle = ranks.slice(10, 20); // 2006-2015 (middle 10 years)
  const recent = ranks.slice(-5); // Last 5 years
  const last7Years = ranks.slice(-7); // Last 7 years

  // Calculate rank variation (standard deviation)
  if (rankedYears.length > 0) {
    const avgRank = rankedYears.reduce((sum, r) => sum + r, 0) / rankedYears.length;
    const variance = rankedYears.reduce((sum, r) => sum + Math.pow(r - avgRank, 2), 0) / rankedYears.length;
    const stdDev = Math.sqrt(variance);

    // 1. Timeless - top 100 consistently (25+ years), minimal variation (±20)
    if (inTop100Count >= 25 && stdDev <= 20) {
      return 'Timeless';
    }
  }

  // 2. Steady Classic - top 200 throughout, never below 300
  if (inTop200Count === totalYears && maxRank <= 300) {
    return 'Steady Classic';
  }

  // 3. Comeback - dropped out of top 500 for 10+ years mid-period, returned to top 200 recently
  const droppedOutMid = middle.filter(r => r > 500).length >= 10;
  const backInTop200 = recent.some(r => r <= 200);
  if (droppedOutMid && backInTop200) {
    return 'Comeback';
  }

  // 4. Shooting Star - dramatic rise 300+ positions in last 5-7 years, now top 200
  const maxInLast7 = Math.max(...last7Years.filter(r => r < 999));
  const minInLast7 = Math.min(...last7Years.filter(r => r < 999));
  const rise7Years = maxInLast7 - minInLast7;
  if (rise7Years >= 300 && lastRank <= 200 && lastRank < 999) {
    return 'Shooting Star';
  }

  // 5. Slow Burn - gradual upward trajectory 20+ years, gained 200+ positions
  if (firstRank < 999 && lastRank < 999) {
    const positionsGained = firstRank - lastRank; // Positive = improvement (lower rank number)
    if (positionsGained >= 200 && rankedYears.length >= 20) {
      // Check for general upward trend
      let improvementYears = 0;
      for (let i = 1; i < ranks.length; i++) {
        if (ranks[i] < 999 && ranks[i-1] < 999 && ranks[i] < ranks[i-1]) {
          improvementYears++;
        }
      }
      if (improvementYears >= rankedYears.length * 0.5) {
        return 'Slow Burn';
      }
    }
  }

  // 6. Fading Glory - was top 100 for 10+ years, now 500+ or unranked
  const wasTop100 = early.filter(r => r <= 100).length >= 7;
  if (wasTop100 && lastRank >= 500) {
    return 'Fading Glory';
  }

  // 7. Flash Trend - sudden spike to top 100 for 3-5 years, then declined rapidly
  let flashPeriod = null;
  for (let i = 0; i < ranks.length; i++) {
    if (ranks[i] <= 100) {
      let consecutiveTop100 = 1;
      let endIdx = i;
      for (let j = i + 1; j < ranks.length && ranks[j] <= 100; j++) {
        consecutiveTop100++;
        endIdx = j;
      }
      if (consecutiveTop100 >= 3 && consecutiveTop100 <= 5) {
        flashPeriod = { start: i, end: endIdx, length: consecutiveTop100 };
        break;
      }
      i = endIdx;
    }
  }
  if (flashPeriod) {
    const afterFlash = ranks.slice(flashPeriod.end + 1);
    const declinedRapidly = afterFlash.some(r => r > minRank + 200);
    if (declinedRapidly) {
      return 'Flash Trend';
    }
  }

  // 8. Cultural Moment - sharp spike correlating with specific events, followed by decline
  let maxSwing = 0;
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] < 999 && ranks[i-1] < 999) {
      const swing = Math.abs(ranks[i] - ranks[i-1]);
      maxSwing = Math.max(maxSwing, swing);
    }
  }
  const hasSpike = minRank <= 100;
  const hasDecline = maxRank - minRank >= 300;
  if (maxSwing >= 150 && hasSpike && hasDecline) {
    return 'Cultural Moment';
  }

  // 9. Generational - peaked in specific decade (first 10 years), rare afterwards
  const earlyAvg = early.filter(r => r < 999).reduce((sum, r) => sum + r, 0) / early.filter(r => r < 999).length;
  const recentAvg = recent.filter(r => r < 999).reduce((sum, r) => sum + r, 0) / recent.filter(r => r < 999).length;
  if (earlyAvg <= 100 && recentAvg >= 400) {
    return 'Generational';
  }

  // 10. Sleeper - consistently 200-500 range for 25+ years
  const in200to500 = ranks.filter(r => r >= 200 && r <= 500).length;
  if (in200to500 >= 25 && minRank >= 200) {
    return 'Sleeper';
  }

  // 11. Volatile - multiple significant swings (150+) with no clear pattern
  let significantSwings = 0;
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] < 999 && ranks[i-1] < 999) {
      if (Math.abs(ranks[i] - ranks[i-1]) >= 150) {
        significantSwings++;
      }
    }
  }
  if (significantSwings >= 3) {
    return 'Volatile';
  }

  // 12. New Entrant - first appeared in last 10 years, gaining momentum
  const firstAppearance = ranks.findIndex(r => r < 999);
  if (firstAppearance >= totalYears - 10 && firstAppearance !== -1) {
    return 'New Entrant';
  }

  // 13. Vintage Revival - unranked for 15+ years, recently re-entered top 500
  const wasUnrankedLong = ranks.slice(5, 20).filter(r => r >= 999).length >= 10;
  if (wasUnrankedLong && lastRank < 500 && lastRank < 999) {
    return 'Vintage Revival';
  }

  // 14. Declining Classic - started top 50, steady decline, still in top 300
  if (firstRank <= 50 && firstRank < 999) {
    const declined = lastRank > firstRank + 100;
    const stillRanked = lastRank <= 300 && lastRank < 999;
    if (declined && stillRanked) {
      return 'Declining Classic';
    }
  }

  // Default: Uncategorized
  return 'Uncategorized';
}

/**
 * Process a dataset and add recent classifications
 */
function addClassifications(data, gender) {
  console.log(`\nProcessing ${data.length} ${gender} names...`);

  let classified = 0;
  let uncategorized = 0;
  const classificationCounts = {};

  data.forEach(nameObj => {
    // Only classify if rankFrom1996 exists
    if (nameObj.rankFrom1996 && Array.isArray(nameObj.rankFrom1996)) {
      const classification = classifyRecent(nameObj.name, nameObj.rankFrom1996);
      nameObj.recentClassification = classification;

      // Track statistics
      classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
      if (classification === 'Uncategorized') {
        uncategorized++;
      } else {
        classified++;
      }
    } else {
      nameObj.recentClassification = 'No Recent Data';
      classificationCounts['No Recent Data'] = (classificationCounts['No Recent Data'] || 0) + 1;
      uncategorized++;
    }
  });

  console.log(`  Classified: ${classified}`);
  console.log(`  Uncategorized/No Data: ${uncategorized}`);
  console.log(`  Classification breakdown:`);
  Object.entries(classificationCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([classification, count]) => {
      console.log(`    ${classification}: ${count}`);
    });

  return data;
}

// Process both datasets
console.log('='.repeat(60));
console.log('Adding recent classifications to name datasets');
console.log('='.repeat(60));

const boysClassified = addClassifications(boysData, 'boys');
const girlsClassified = addClassifications(girlsData, 'girls');

// Write updated data back to files
fs.writeFileSync(
  path.join(__dirname, '../data/boys.json'),
  JSON.stringify(boysClassified, null, 2),
  'utf-8'
);

fs.writeFileSync(
  path.join(__dirname, '../data/girls.json'),
  JSON.stringify(girlsClassified, null, 2),
  'utf-8'
);

console.log('\n' + '='.repeat(60));
console.log('✓ Recent classifications added successfully!');
console.log('='.repeat(60));
console.log(`\nUpdated files:`);
console.log(`  - data/boys.json`);
console.log(`  - data/girls.json`);
console.log(`\nEach name now has a 'recentClassification' property.`);
