const fs = require('fs');
const path = require('path');

// Define time periods with their decade indices
const TIME_PERIODS = {
  '1-early-century': {
    label: '1900-1940',
    decadeIndices: [0, 1, 2, 3, 4], // 1900s, 1910s, 1920s, 1930s, 1940s
    decades: ['1900s', '1910s', '1920s', '1930s', '1940s']
  },
  '2-mid-century': {
    label: '1950-1970',
    decadeIndices: [5, 6, 7], // 1950s, 1960s, 1970s
    decades: ['1950s', '1960s', '1970s']
  },
  '3-end-century': {
    label: '1980-1990',
    decadeIndices: [8, 9], // 1980s, 1990s
    decades: ['1980s', '1990s']
  },
  '4-recent': {
    label: '2000-2020',
    decadeIndices: [10, 11, 12], // 2000s, 2010s, 2020s
    decades: ['2000s', '2010s', '2020s']
  }
};

function calculatePopularity(bestRank) {
  if (bestRank === null) return 0;
  if (bestRank >= 76 && bestRank <= 100) return 1;
  if (bestRank >= 51 && bestRank <= 75) return 2;
  if (bestRank >= 26 && bestRank <= 50) return 3;
  if (bestRank >= 11 && bestRank <= 25) return 4;
  if (bestRank >= 1 && bestRank <= 10) return 5;
  return 0; // Fallback for ranks > 100
}

function calculateHistoricProfile(rankHistoric) {
  const profile = {};

  for (const [periodKey, periodConfig] of Object.entries(TIME_PERIODS)) {
    let bestRank = null;
    let bestDecade = null;

    // Check each decade in this period
    for (const decadeIndex of periodConfig.decadeIndices) {
      const rank = rankHistoric[decadeIndex];

      // Skip if unranked (x)
      if (rank === 'x') continue;

      const numericRank = parseInt(rank);

      // Update best rank if this is better (lower number = better rank)
      if (bestRank === null || numericRank < bestRank) {
        bestRank = numericRank;
        bestDecade = periodConfig.decades[periodConfig.decadeIndices.indexOf(decadeIndex)];
      }
    }

    profile[periodKey] = {
      'best-rank': bestRank,
      'best-decade': bestDecade,
      'popularity': calculatePopularity(bestRank)
    };
  }

  return profile;
}

function processFile(filePath) {
  console.log(`\nProcessing ${filePath}...`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  let processedCount = 0;

  data.forEach(name => {
    if (name.rankHistoric && name.rankHistoric.length > 0) {
      name['historic-profile'] = calculateHistoricProfile(name.rankHistoric);
      processedCount++;
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`✓ Processed ${processedCount} names`);
  console.log(`✓ Saved to ${filePath}`);

  // Show example
  if (data.length > 0) {
    const example = data[0];
    console.log(`\nExample (${example.name}):`);
    console.log(JSON.stringify(example['historic-profile'], null, 2));
  }
}

// Process both files
const boysPath = path.join(__dirname, '../data/boys.json');
const girlsPath = path.join(__dirname, '../data/girls.json');

if (fs.existsSync(boysPath)) {
  processFile(boysPath);
}

if (fs.existsSync(girlsPath)) {
  processFile(girlsPath);
}

console.log('\n✓ Historic profiles added successfully!\n');
