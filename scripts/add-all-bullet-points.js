#!/usr/bin/env node

/**
 * Add all bullet points to data files
 * Usage: node scripts/add-all-bullet-points.js [--dev]
 */

const fs = require('fs');
const path = require('path');

// Check if --dev flag is passed
const isDev = process.argv.includes('--dev');
const suffix = isDev ? '-dev' : '';

const BOYS_FILE = path.join(__dirname, `../data/boys${suffix}.json`);
const GIRLS_FILE = path.join(__dirname, `../data/girls${suffix}.json`);

console.log(`Processing ${isDev ? 'DEV' : 'PRODUCTION'} data files`);
console.log('='.repeat(60));

// Load bullet point generators
function getRankWithSuffix(rank) {
  const rankNum = parseInt(rank);
  if (rankNum % 100 >= 11 && rankNum % 100 <= 13) {
    return rankNum + 'th';
  }
  const lastDigit = rankNum % 10;
  switch (lastDigit) {
    case 1: return rankNum + 'st';
    case 2: return rankNum + 'nd';
    case 3: return rankNum + 'rd';
    default: return rankNum + 'th';
  }
}

function addBulletPoint1(nameData) {
  const { name, rank, count, gender } = nameData;
  if (!name || !rank || !count || !gender) return;
  const genderLower = gender.toLowerCase();
  nameData.bulletPoint1 = `In 2024 ${count.toLocaleString()} ${genderLower} babies were named ${name} making it the ${getRankWithSuffix(rank)} most popular ${genderLower}'s name`;
}

function addBulletPoint2(nameData) {
  const { name, rankFrom1996 } = nameData;
  if (!name || !rankFrom1996 || rankFrom1996.length < 29) return;

  const last5Years = rankFrom1996.slice(-5);
  const validRanks = last5Years
    .map((r, i) => ({ rank: r === 'x' ? null : parseInt(r), index: i }))
    .filter(d => d.rank !== null);

  if (validRanks.length < 2) {
    nameData.bulletPoint2 = `${name} is currently maintaining popularity`;
    return;
  }

  const firstRank = validRanks[0].rank;
  const lastRank = validRanks[validRanks.length - 1].rank;
  const change = firstRank - lastRank;

  let trend = 'maintaining';
  if (change > 20) trend = 'gaining';
  else if (change < -20) trend = 'losing';

  nameData.bulletPoint2 = `${name} is currently ${trend} popularity`;
}

function addBulletPoint3(nameData) {
  const { name, rankFrom1996 } = nameData;
  if (!name || !rankFrom1996 || rankFrom1996.length < 29) return;

  const last20Years = rankFrom1996.slice(9, 29);
  const startYear = 2005;

  const dataPoints = last20Years
    .map((r, i) => ({
      rank: r === 'x' ? null : parseInt(r),
      year: startYear + i,
      index: i
    }))
    .filter(d => d.rank !== null);

  if (dataPoints.length < 5) {
    nameData.bulletPoint3 = `Over the past 20 years ${name} has had limited ranking data`;
    return;
  }

  const ranks = dataPoints.map(d => d.rank);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);
  const minYear = dataPoints.find(d => d.rank === minRank).year;
  const maxYear = dataPoints.find(d => d.rank === maxRank).year;
  const firstRank = dataPoints[0].rank;
  const lastRank = dataPoints[dataPoints.length - 1].rank;
  const range = maxRank - minRank;

  const changes = [];
  for (let i = 1; i < dataPoints.length; i++) {
    changes.push(Math.abs(dataPoints[i].rank - dataPoints[i - 1].rank));
  }
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  const peakIndex = dataPoints.findIndex(d => d.rank === minRank);
  const overallChange = firstRank - lastRank;

  if (range <= 50 && avgChange <= 10) {
    nameData.bulletPoint3 = `Over the past 20 years ${name} has maintained a steady ranking between #${minRank} in ${minYear} and #${maxRank} in ${maxYear}`;
  } else if (avgChange > 40) {
    nameData.bulletPoint3 = `Over the past 20 years ${name} has jumped around erratically between #${minRank} in ${minYear} and #${maxRank} in ${maxYear}`;
  } else if (overallChange > 100 && lastRank < firstRank * 0.7) {
    nameData.bulletPoint3 = `Over the past 20 years ${name} has steadily gained popularity from #${firstRank} in ${startYear} to #${lastRank} in 2024`;
  } else if (overallChange < -100 && lastRank > firstRank * 1.5) {
    nameData.bulletPoint3 = `Over the past 20 years ${name} has steadily declined in popularity from #${firstRank} in ${startYear} to #${lastRank} in 2024`;
  } else if (peakIndex < dataPoints.length * 0.6 && lastRank > minRank * 1.5) {
    nameData.bulletPoint3 = `Over the past 20 years ${name} gained in popularity to #${minRank} in ${minYear} but has since declined to #${lastRank} in 2024`;
  } else {
    const valleyIndex = dataPoints.findIndex(d => d.rank === maxRank);
    if (valleyIndex < dataPoints.length * 0.6 && lastRank < maxRank * 0.7) {
      nameData.bulletPoint3 = `Over the past 20 years ${name} dropped in popularity to #${maxRank} in ${maxYear} but has since regained popularity to #${lastRank} in 2024`;
    } else {
      nameData.bulletPoint3 = `Over the past 20 years ${name} has cycled in and out of fashion achieving a peak of #${minRank} in ${minYear} and a low of #${maxRank} in ${maxYear}`;
    }
  }
}

function addBulletPoint4(nameData) {
  const { name, rankHistoric, rank } = nameData;
  if (!name || !rankHistoric || rankHistoric.length < 13) return;

  const getDecadeName = (index) => `${1900 + index * 10}s`;

  const decades = rankHistoric.map((r, i) => ({
    decade: getDecadeName(i + 1),
    rank: r === 'x' ? null : parseInt(r),
    index: i
  }));

  const rankedDecades = decades.filter(d => d.rank !== null);
  const numRanked = rankedDecades.length;

  if (numRanked === 0) {
    nameData.bulletPoint4 = `Historically ${name} has never made it to the top 100 lists`;
    return;
  }

  const ranks = rankedDecades.map(d => d.rank);
  const minRank = Math.min(...ranks);
  const bestDecade = rankedDecades.find(d => d.rank === minRank);
  const firstRanked = rankedDecades[0];
  const lastRanked = rankedDecades[rankedDecades.length - 1];

  if (numRanked === 13) {
    nameData.bulletPoint4 = `Historically ${name} has always been a popular name and has never dropped out of the top 100 names`;
    return;
  }

  const earlyRanked = rankedDecades.filter(d => d.index < 4).length > 0;
  const recentRanked = rankedDecades.filter(d => d.index >= 10).length > 0;
  const midGap = decades.slice(4, 10).every(d => d.rank === null);

  if (earlyRanked && recentRanked && midGap && rank < 100) {
    const gapStart = decades.findIndex(d => d.rank === null && d.index > 2);
    const gapEnd = decades.findIndex((d, i) => i > gapStart && d.rank !== null);
    const yearsGap = (gapEnd - gapStart) * 10;
    nameData.bulletPoint4 = `Historically ${name} was very popular in the early 20th century (#${bestDecade.rank} in the ${bestDecade.decade}), dropped out of the top 100 for ${yearsGap} years, but has revived and is now ranked #${rank}`;
    return;
  }

  if (numRanked <= 3) {
    const decadeList = rankedDecades.map(d => d.decade).join(', ');
    const plural = numRanked > 1 ? 's' : '';
    nameData.bulletPoint4 = `Historically ${name} has only made it to the top 100 list ${numRanked} time${plural} in the ${decadeList}`;
    return;
  }

  if (firstRanked.index >= 8) {
    nameData.bulletPoint4 = `Historically ${name} is a modern name and didn't rank in the top 100 until the ${firstRanked.decade}`;
    return;
  }

  const notRankedRecently = lastRanked.index < 10;

  if (notRankedRecently) {
    if (bestDecade.index < 4) {
      nameData.bulletPoint4 = `Historically ${name} was most popular in the early 20th century (#${bestDecade.rank} in the ${bestDecade.decade}) but hasn't ranked in the top 100 since the ${lastRanked.decade}`;
      return;
    }
    if (bestDecade.index >= 4 && bestDecade.index < 7) {
      nameData.bulletPoint4 = `Historically ${name} was popular in the mid 20th century (#${bestDecade.rank} in the ${bestDecade.decade}) but hasn't ranked in the top 100 since the ${lastRanked.decade}`;
      return;
    }
    if (bestDecade.index >= 7 && bestDecade.index < 10) {
      nameData.bulletPoint4 = `Historically ${name} was popular in the late 20th century (#${bestDecade.rank} in the ${bestDecade.decade}) but hasn't ranked in the top 100 since the ${lastRanked.decade}`;
      return;
    }
  }

  const spanYears = (lastRanked.index - firstRanked.index + 1) * 10;
  if (spanYears <= 50 && firstRanked.index > 0 && lastRanked.index < 10) {
    nameData.bulletPoint4 = `Historically ${name} made it to the top 100 names between the ${firstRanked.decade} and ${lastRanked.decade} peaking in the ${bestDecade.decade}`;
    return;
  }

  nameData.bulletPoint4 = `Historically ${name} achieved its peak popularity of #${bestDecade.rank} in the ${bestDecade.decade}`;
}

function processFile(filePath, genderName) {
  console.log(`\nProcessing ${genderName}...`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updated = 0;

  data.forEach(nameData => {
    // Add gender property if not present
    if (!nameData.gender) {
      nameData.gender = genderName === 'Boys' ? 'Boy' : 'Girl';
    }

    addBulletPoint1(nameData);
    addBulletPoint2(nameData);
    addBulletPoint3(nameData);
    addBulletPoint4(nameData);
    updated++;
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✓ Added all bullet points to ${updated} ${genderName.toLowerCase()} names`);
}

// Main execution
processFile(BOYS_FILE, 'Boys');
processFile(GIRLS_FILE, 'Girls');

console.log('\n' + '='.repeat(60));
console.log('✓ All bullet points generation complete!');
