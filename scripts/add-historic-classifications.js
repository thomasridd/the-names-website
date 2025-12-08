const fs = require('fs');
const path = require('path');

// Read the JSON data files
const boysData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/boys.json'), 'utf-8'));
const girlsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/girls.json'), 'utf-8'));

/**
 * Classification logic for HISTORIC patterns (1910s-2020s, 13 decades)
 * Based on data/historic-classifications.txt
 */
function classifyHistoric(name, rankArray) {
  // Convert rank strings to numbers, treat 'x' as unranked (999)
  const ranks = rankArray.map(r => {
    if (r === 'x' || r === '' || r === null) return 999;
    const parsed = parseInt(r);
    return isNaN(parsed) ? 999 : parsed;
  });

  const totalDecades = ranks.length; // Should be 13

  // Helper functions
  const inTop100 = ranks.map(r => r <= 100);
  const inTop100Count = inTop100.filter(Boolean).length;
  const inTop20Count = ranks.filter(r => r <= 20).length;
  const inTop10Count = ranks.filter(r => r <= 10).length;

  const rankedDecades = ranks.filter(r => r < 999);
  const minRank = rankedDecades.length > 0 ? Math.min(...rankedDecades) : 999;

  // Split into periods
  const early = ranks.slice(0, 4); // 1910s-1940s
  const midCentury = ranks.slice(3, 7); // 1940s-1970s
  const late = ranks.slice(6, 10); // 1970s-2000s
  const modern = ranks.slice(9); // 2000s-2020s
  const recent = ranks.slice(-3); // Last 3 decades

  // 1. Century Classic - top 100 in 10+ decades, never absent for more than 1 consecutive decade
  if (inTop100Count >= 10) {
    let maxGap = 0;
    let currentGap = 0;
    for (let i = 0; i < ranks.length; i++) {
      if (ranks[i] > 100) {
        currentGap++;
        maxGap = Math.max(maxGap, currentGap);
      } else {
        currentGap = 0;
      }
    }
    if (maxGap <= 1) {
      return 'Century Classic';
    }
  }

  // 2. Golden Age - dominated (top 20) for 3-5 consecutive decades, then faded from top 100
  let top20Streaks = [];
  let currentStreak = 0;
  for (let i = 0; i < ranks.length; i++) {
    if (ranks[i] <= 20) {
      currentStreak++;
    } else {
      if (currentStreak >= 3) {
        top20Streaks.push({ start: i - currentStreak, length: currentStreak });
      }
      currentStreak = 0;
    }
  }
  if (currentStreak >= 3) {
    top20Streaks.push({ start: ranks.length - currentStreak, length: currentStreak });
  }

  const hasGoldenAge = top20Streaks.some(s => s.length >= 3 && s.length <= 5);
  const fadedFromTop100 = recent.every(r => r > 100);
  if (hasGoldenAge && fadedFromTop100) {
    return 'Golden Age';
  }

  // 3. Early Century - top 100 from 1910s-1950s, largely disappeared by 1970s onwards
  const earlyTop100 = early.filter(r => r <= 100).length >= 3;
  const lateDisappeared = ranks.slice(6).filter(r => r > 100).length >= 5;
  if (earlyTop100 && lateDisappeared) {
    return 'Early Century';
  }

  // 4. Mid-Century - peak popularity 1940s-1970s, minimal presence before or after
  const midPeak = midCentury.filter(r => r <= 50).length >= 2;
  const minimalBefore = early.filter(r => r <= 100).length <= 1;
  const minimalAfter = ranks.slice(7).filter(r => r <= 100).length <= 1;
  if (midPeak && (minimalBefore || minimalAfter)) {
    return 'Mid-Century';
  }

  // 5. Late Century - emerged in top 100 during 1970s-1990s, maintaining or growing since
  const emergedInLate = late.some(r => r <= 100);
  const notInEarly = early.every(r => r > 100);
  const maintainedInModern = modern.some(r => r <= 100);
  if (emergedInLate && notInEarly && maintainedInModern) {
    return 'Late Century';
  }

  // 6. Modern Era - first entered top 100 in 2000s or later
  const firstTop100Index = ranks.findIndex(r => r <= 100);
  if (firstTop100Index >= 9 && firstTop100Index !== -1) { // Index 9 = 2000s
    return 'Modern Era';
  }

  // 7. Pendulum - popular early (1910s-1930s), disappeared mid-century, returned in 2000s+
  const popularEarly = ranks.slice(0, 3).some(r => r <= 100);
  const disappearedMid = ranks.slice(3, 8).filter(r => r > 100).length >= 3;
  const returnedRecent = modern.some(r => r <= 100);
  if (popularEarly && disappearedMid && returnedRecent) {
    return 'Pendulum';
  }

  // 8. Lost Generation - top 100 in early decades (pre-1950s), hasn't returned since
  const top100Early = early.some(r => r <= 100);
  const notReturnedSince = ranks.slice(4).every(r => r > 100);
  if (top100Early && notReturnedSince) {
    return 'Lost Generation';
  }

  // 9. Steady Decline - started in top 100 in 1910s, gradually declining each decade
  if (ranks[0] <= 100) {
    let decliningTrend = true;
    let previousRank = ranks[0];
    let declineCount = 0;

    for (let i = 1; i < ranks.length; i++) {
      if (ranks[i] < 999 && previousRank < 999) {
        if (ranks[i] > previousRank) {
          declineCount++;
        }
        previousRank = ranks[i];
      }
    }

    if (declineCount >= rankedDecades.length * 0.6) {
      return 'Steady Decline';
    }
  }

  // 10. Steady Rise - started outside/barely in top 100 early, consistently climbing, now firmly established
  const startedLow = ranks[0] > 50 || ranks[0] === 999;
  const nowHigh = recent.some(r => r <= 50);

  if (startedLow && nowHigh) {
    let risingTrend = true;
    let riseCount = 0;

    for (let i = 1; i < ranks.length; i++) {
      if (ranks[i] < 999 && ranks[i-1] < 999) {
        if (ranks[i] < ranks[i-1]) { // Lower rank number = better
          riseCount++;
        }
      }
    }

    if (riseCount >= rankedDecades.length * 0.5) {
      return 'Steady Rise';
    }
  }

  // 11. Peak and Fade - reached top 10 in at least one decade, then dropped out of top 100 within 3-4 decades
  const reachedTop10 = ranks.some(r => r <= 10);
  if (reachedTop10) {
    const peakIndex = ranks.findIndex(r => r <= 10);
    const droppedOut = ranks.slice(peakIndex + 1, peakIndex + 5).some(r => r > 100);
    if (droppedOut) {
      return 'Peak and Fade';
    }
  }

  // 12. Brief Moment - appeared in top 100 for only 1-3 non-consecutive decades
  if (inTop100Count >= 1 && inTop100Count <= 3) {
    return 'Brief Moment';
  }

  // 13. Resilient - consistently in top 100 across 7-9 decades but never reaches top 20
  if (inTop100Count >= 7 && inTop100Count <= 9 && inTop20Count === 0) {
    return 'Resilient';
  }

  // 14. Intermittent - appears in top 100 for 4-6 decades with significant gaps (2+ consecutive decades missing)
  if (inTop100Count >= 4 && inTop100Count <= 6) {
    let maxGap = 0;
    let currentGap = 0;
    for (let i = 0; i < ranks.length; i++) {
      if (ranks[i] > 100) {
        currentGap++;
        maxGap = Math.max(maxGap, currentGap);
      } else {
        currentGap = 0;
      }
    }
    if (maxGap >= 2) {
      return 'Intermittent';
    }
  }

  // 15. Revolutionary - sharp entry into top 100 coinciding with major cultural shifts
  // 1960s = index 5, 1990s = index 8
  const revolutionaryPeriods = [5, 8]; // 1960s, 1990s
  for (const idx of revolutionaryPeriods) {
    if (idx > 0 && idx < ranks.length) {
      const wasNotTop100 = ranks[idx - 1] > 100;
      const becameTop100 = ranks[idx] <= 100;
      const sharpEntry = ranks[idx] <= 50;

      if (wasNotTop100 && becameTop100 && sharpEntry) {
        return 'Revolutionary';
      }
    }
  }

  // Default: Uncategorized
  return 'Uncategorized';
}

/**
 * Process a dataset and add historic classifications
 */
function addClassifications(data, gender) {
  console.log(`\nProcessing ${data.length} ${gender} names...`);

  let classified = 0;
  let uncategorized = 0;
  const classificationCounts = {};

  data.forEach(nameObj => {
    // Only classify if rankHistoric exists
    if (nameObj.rankHistoric && Array.isArray(nameObj.rankHistoric)) {
      const classification = classifyHistoric(nameObj.name, nameObj.rankHistoric);
      nameObj.historicClassification = classification;

      // Track statistics
      classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
      if (classification === 'Uncategorized') {
        uncategorized++;
      } else {
        classified++;
      }
    } else {
      nameObj.historicClassification = 'No Historic Data';
      classificationCounts['No Historic Data'] = (classificationCounts['No Historic Data'] || 0) + 1;
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
console.log('Adding historic classifications to name datasets');
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
console.log('✓ Historic classifications added successfully!');
console.log('='.repeat(60));
console.log(`\nUpdated files:`);
console.log(`  - data/boys.json`);
console.log(`  - data/girls.json`);
console.log(`\nEach name now has a 'historicClassification' property.`);
