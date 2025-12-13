#!/usr/bin/env node

/**
 * Add Bullet Point 4: Historic Trend
 *
 * Analyzes rankHistoric (13 decades: 1910s-2020s) and picks the most appropriate pattern:
 * 1) has never made it to the top 100 lists
 * 2) has only made it to the top 100 list {n} times in the {list of decades}
 * 3) made it to the top 100 between {decade_one} and {decade_two} peaking in {decade_max}
 * 4) was most popular in the early 20th century but hasn't ranked since {last_decade}
 * 5) was popular in the mid 20th century but hasn't ranked since {last_decade}
 * 6) was popular in the late 20th century but hasn't ranked since {last_decade}
 * 7) is a modern name and didn't rank until {first_decade}
 * 8) was very popular in early 20th century, dropped out, but has revived
 * 9) has always been popular and never dropped out of top 100
 */

const fs = require('fs');
const path = require('path');

const BOYS_FILE = path.join(__dirname, '../data/boys.json');
const GIRLS_FILE = path.join(__dirname, '../data/girls.json');

function getDecadeName(index) {
  return `${1900 + index * 10}s`;
}

function analyzeHistoricTrend(name, rankHistoric, currentRank) {
  // rankHistoric has 13 values for decades 1910s-2020s (indices 0-12)
  const decades = rankHistoric.map((r, i) => ({
    decade: getDecadeName(i + 1), // +1 because first entry is 1910s
    rank: r === 'x' ? null : parseInt(r),
    index: i
  }));

  const rankedDecades = decades.filter(d => d.rank !== null);
  const numRanked = rankedDecades.length;

  // 1) Never made it to top 100
  if (numRanked === 0) {
    return `Historically ${name} has never made it to the top 100 lists`;
  }

  // Find min/max rank and their decades
  const ranks = rankedDecades.map(d => d.rank);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);
  const bestDecade = rankedDecades.find(d => d.rank === minRank);

  // Find first and last ranked decades
  const firstRanked = rankedDecades[0];
  const lastRanked = rankedDecades[rankedDecades.length - 1];

  // 9) Always been popular - all 13 decades ranked
  if (numRanked === 13) {
    return `Historically ${name} has always been a popular name and has never dropped out of the top 100 names`;
  }

  // Check if there are gaps for revival pattern
  const hasGaps = decades.some((d, i) => {
    if (i === 0 || i === decades.length - 1) return false;
    return d.rank === null && decades[i - 1].rank !== null && decades[i + 1].rank !== null;
  });

  // 8) Revival pattern - popular early, dropped out, now back
  const earlyRanked = rankedDecades.filter(d => d.index < 4).length > 0;
  const recentRanked = rankedDecades.filter(d => d.index >= 10).length > 0;
  const midGap = decades.slice(4, 10).every(d => d.rank === null);

  if (earlyRanked && recentRanked && midGap && currentRank < 100) {
    const gapStart = decades.findIndex(d => d.rank === null && d.index > 2);
    const gapEnd = decades.findIndex((d, i) => i > gapStart && d.rank !== null);
    const yearsGap = (gapEnd - gapStart) * 10;
    return `Historically ${name} was very popular in the early 20th century (#${bestDecade.rank} in the ${bestDecade.decade}), dropped out of the top 100 for ${yearsGap} years, but has revived and is now ranked #${currentRank}`;
  }

  // 2) Only made it a few times - less than 3 times and not consecutive
  if (numRanked <= 3) {
    const decadeList = rankedDecades.map(d => d.decade).join(', ');
    const plural = numRanked > 1 ? 's' : '';
    return `Historically ${name} has only made it to the top 100 list ${numRanked} time${plural} in the ${decadeList}`;
  }

  // 7) Modern name - first appeared in 1990s or later
  if (firstRanked.index >= 8) { // index 8 = 1990s
    return `Historically ${name} is a modern name and didn't rank in the top 100 until the ${firstRanked.decade}`;
  }

  // Check if it's no longer in top 100
  const notRankedRecently = lastRanked.index < 10; // Not ranked in 2000s or 2010s

  if (notRankedRecently) {
    // 4) Early 20th century - peaked before 1950s
    if (bestDecade.index < 4) {
      return `Historically ${name} was most popular in the early 20th century (#${bestDecade.rank} in the ${bestDecade.decade}) but hasn't ranked in the top 100 since the ${lastRanked.decade}`;
    }

    // 5) Mid 20th century - peaked 1940s-1970s
    if (bestDecade.index >= 4 && bestDecade.index < 7) {
      return `Historically ${name} was popular in the mid 20th century (#${bestDecade.rank} in the ${bestDecade.decade}) but hasn't ranked in the top 100 since the ${lastRanked.decade}`;
    }

    // 6) Late 20th century - peaked 1970s-1990s
    if (bestDecade.index >= 7 && bestDecade.index < 10) {
      return `Historically ${name} was popular in the late 20th century (#${bestDecade.rank} in the ${bestDecade.decade}) but hasn't ranked in the top 100 since the ${lastRanked.decade}`;
    }
  }

  // 3) Made it to top 100 between specific decades (continuous period less than 50 years)
  const spanYears = (lastRanked.index - firstRanked.index + 1) * 10;
  if (spanYears <= 50 && firstRanked.index > 0 && lastRanked.index < 10) {
    return `Historically ${name} made it to the top 100 names between the ${firstRanked.decade} and ${lastRanked.decade} peaking in the ${bestDecade.decade}`;
  }

  // Default - general statement
  return `Historically ${name} achieved its peak popularity of #${bestDecade.rank} in the ${bestDecade.decade}`;
}

function addBulletPoint4(names) {
  let updated = 0;

  names.forEach(nameData => {
    const { name, rankHistoric, rank } = nameData;

    if (!name || !rankHistoric || rankHistoric.length < 13) {
      console.warn(`Skipping ${name || 'unknown'}: missing rankHistoric data`);
      return;
    }

    const bulletPoint = analyzeHistoricTrend(name, rankHistoric, rank);
    nameData.bulletPoint4 = bulletPoint;
    updated++;
  });

  return updated;
}

function processFile(filePath, genderName) {
  console.log(`\nProcessing ${genderName}...`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updated = addBulletPoint4(data);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✓ Added bullet point 4 to ${updated} ${genderName.toLowerCase()} names`);
}

// Main execution
console.log('Adding Bullet Point 4: Historic Trend\n' + '='.repeat(50));

processFile(BOYS_FILE, 'Boys');
processFile(GIRLS_FILE, 'Girls');

console.log('\n' + '='.repeat(50));
console.log('✓ Bullet Point 4 generation complete!');
