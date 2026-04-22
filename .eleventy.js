const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { execSync } = require('child_process');

module.exports = function(eleventyConfig) {
  // Determine which data files to use based on git branch
  // Use full dataset on main branch, dev dataset on all other branches
  let USE_DEV_DATA;

  if (process.env.USE_DEV_DATA !== undefined) {
    // Allow manual override via environment variable
    USE_DEV_DATA = process.env.USE_DEV_DATA === 'true';
    console.log(`\n🔧 Manual override: USE_DEV_DATA=${USE_DEV_DATA}`);
  } else {
    // Auto-detect based on git branch
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      USE_DEV_DATA = currentBranch !== 'main';
      console.log(`\n🔧 Auto-detected branch: "${currentBranch}"`);
    } catch (error) {
      // If git command fails (not a git repo, etc.), default to dev data for safety
      USE_DEV_DATA = true;
      console.log(`\n⚠️  Could not detect git branch, defaulting to dev data`);
    }
  }

  const dataSuffix = USE_DEV_DATA ? '-dev.json' : '.json';
  console.log(`🔧 Build mode: ${USE_DEV_DATA ? 'DEVELOPMENT (top 500 names)' : 'PRODUCTION (all names)'}`);
  console.log(`📁 Data files: boys${dataSuffix} & girls${dataSuffix}\n`);

  // Pass through static assets
  // Note: CSS is processed separately with PostCSS/Tailwind
  eleventyConfig.addPassthroughCopy('src/scripts');
  eleventyConfig.addPassthroughCopy('src/assets');

  // Helper function to create URL-safe slugs
  function createSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Add custom filter to filter arrays by property
  eleventyConfig.addFilter('filterByGender', function(array, gender) {
    return array.filter(item => item.gender === gender);
  });

  // Load JSON data for all names (boys + girls)
  eleventyConfig.addGlobalData('allNames', () => {
    const boysPath = path.join(__dirname, 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, 'data', `girls${dataSuffix}`);

    let allNames = [];

    // Load boys names
    if (fs.existsSync(boysPath)) {
      const boysData = JSON.parse(fs.readFileSync(boysPath, 'utf-8'));
      const boysWithGender = boysData.map(name => {
        return { ...name, gender: 'Boy' };
      });
      allNames = allNames.concat(boysWithGender);
      console.log(`Loaded ${boysData.length} boys names`);
    }

    // Load girls names
    if (fs.existsSync(girlsPath)) {
      const girlsData = JSON.parse(fs.readFileSync(girlsPath, 'utf-8'));
      const girlsWithGender = girlsData.map(name => {
        return { ...name, gender: 'Girl' };
      });
      allNames = allNames.concat(girlsWithGender);
      console.log(`Loaded ${girlsData.length} girls names`);
    }

    // Create a lookup map for quick access to name data
    const nameMap = new Map();
    allNames.forEach(name => {
      const key = `${name.name.toLowerCase()}-${name.gender}`;
      nameMap.set(key, name);
    });

    // Enrich relatedNamesWithRank with count and uniqueSlug data
    allNames.forEach(name => {
      if (name.relatedNamesWithRank && name.relatedNamesWithRank.length > 0) {
        name.relatedNamesWithRank = name.relatedNamesWithRank.map(relatedName => {
          const key = `${relatedName.name.toLowerCase()}-${relatedName.gender || name.gender}`;
          const fullData = nameMap.get(key);
          return {
            ...relatedName,
            count: fullData ? fullData.count : null,
            uniqueSlug: fullData ? fullData.uniqueSlug : null
          };
        });
      }
    });

    console.log(`Total names loaded: ${allNames.length}`);
    return allNames;
  });

  // Load sample CSV data for homepage featured names
  eleventyConfig.addGlobalData('names', () => {
    const csvPath = path.join(__dirname, 'data', 'names.csv');

    // Check if CSV file exists
    if (!fs.existsSync(csvPath)) {
      console.warn('Warning: names.csv not found. Using JSON data for homepage.');
      // Return first 10 from JSON data
      const allNames = eleventyConfig.globalData.allNames();
      return allNames.slice(0, 10);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    return records;
  });

  // Load YAML config
  eleventyConfig.addGlobalData('siteConfig', () => {
    return {
      title: 'The Names Website',
      description: 'A website for thinking about names'
    };
  });

  // Load classification descriptions
  eleventyConfig.addGlobalData('classificationDescriptions', () => {
    const descriptionsPath = path.join(__dirname, 'data', 'classification-descriptions.json');
    if (fs.existsSync(descriptionsPath)) {
      return JSON.parse(fs.readFileSync(descriptionsPath, 'utf-8'));
    }
    return { five_year: {}, recent: {}, historic: {} };
  });

  // Generate classification pages data
  eleventyConfig.addGlobalData('classifications', () => {
    const boysPath = path.join(__dirname, 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, 'data', `girls${dataSuffix}`);
    const descriptionsPath = path.join(__dirname, 'data', 'classification-descriptions.json');

    let allNames = [];

    // Load boys names
    if (fs.existsSync(boysPath)) {
      const boysData = JSON.parse(fs.readFileSync(boysPath, 'utf-8'));
      const boysWithGender = boysData.map(name => ({ ...name, gender: 'Boy' }));
      allNames = allNames.concat(boysWithGender);
    }

    // Load girls names
    if (fs.existsSync(girlsPath)) {
      const girlsData = JSON.parse(fs.readFileSync(girlsPath, 'utf-8'));
      const girlsWithGender = girlsData.map(name => ({ ...name, gender: 'Girl' }));
      allNames = allNames.concat(girlsWithGender);
    }

    // Load descriptions
    let descriptions = { five_year: {}, recent: {}, historic: {} };
    if (fs.existsSync(descriptionsPath)) {
      descriptions = JSON.parse(fs.readFileSync(descriptionsPath, 'utf-8'));
    }

    const classifications = [];

    // Process five_year classifications
    const fiveYearGroups = {};
    allNames.forEach(name => {
      if (name.classifications && name.classifications.five_year) {
        if (!fiveYearGroups[name.classifications.five_year]) {
          fiveYearGroups[name.classifications.five_year] = [];
        }
        fiveYearGroups[name.classifications.five_year].push(name);
      }
    });

    Object.keys(fiveYearGroups).forEach(classificationName => {
      classifications.push({
        name: classificationName,
        slug: createSlug(classificationName),
        type: 'five_year',
        period: '2020-2024',
        description: descriptions.five_year[classificationName] || '',
        names: fiveYearGroups[classificationName],
        count: fiveYearGroups[classificationName].length
      });
    });

    // Process recent classifications
    const recentGroups = {};
    allNames.forEach(name => {
      if (name.classifications && name.classifications.recent) {
        if (!recentGroups[name.classifications.recent]) {
          recentGroups[name.classifications.recent] = [];
        }
        recentGroups[name.classifications.recent].push(name);
      }
    });

    Object.keys(recentGroups).forEach(classificationName => {
      classifications.push({
        name: classificationName,
        slug: createSlug(classificationName),
        type: 'recent',
        period: '1996-2024',
        description: descriptions.recent[classificationName] || '',
        names: recentGroups[classificationName],
        count: recentGroups[classificationName].length
      });
    });

    // Process historic classifications
    const historicGroups = {};
    allNames.forEach(name => {
      if (name.classifications && name.classifications.historic) {
        if (!historicGroups[name.classifications.historic]) {
          historicGroups[name.classifications.historic] = [];
        }
        historicGroups[name.classifications.historic].push(name);
      }
    });

    Object.keys(historicGroups).forEach(classificationName => {
      classifications.push({
        name: classificationName,
        slug: createSlug(classificationName),
        type: 'historic',
        period: '1904-2024',
        description: descriptions.historic[classificationName] || '',
        names: historicGroups[classificationName],
        count: historicGroups[classificationName].length
      });
    });

    console.log(`Generated ${classifications.length} classification pages`);
    return classifications;
  });

  // Format large numbers with comma separators
  eleventyConfig.addFilter('formatNumber', n => n == null ? '-' : n.toLocaleString('en-GB'));

  // Per-gender, per-year count thresholds for rank guideline lines on the
  // modern rankings chart. For each year 1996–2024 we sort all annual counts
  // descending and read off the value at positions 10, 50, 100, 500, 1000 and
  // 5000 — that count is what a name at that rank had that year.
  eleventyConfig.addGlobalData('rankCountGuidelines', () => {
    const thresholds = [10, 50, 100, 500, 1000, 5000];
    const startYear = 1996;
    const numYears = 29;
    const result = { Boy: [], Girl: [], thresholds };

    const buildFor = (filename, gender) => {
      const filePath = path.join(__dirname, 'data', `${filename}${dataSuffix}`);
      if (!fs.existsSync(filePath)) return;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      for (let y = 0; y < numYears; y++) {
        const counts = [];
        for (const n of data) {
          if (!n.countFrom1996) continue;
          const c = parseInt(n.countFrom1996[y], 10);
          if (!isNaN(c)) counts.push(c);
        }
        counts.sort((a, b) => b - a);
        const yearEntry = { year: startYear + y, counts: {} };
        for (const t of thresholds) {
          if (t <= counts.length) yearEntry.counts[t] = counts[t - 1];
        }
        result[gender].push(yearEntry);
      }
    };

    buildFor('boys', 'Boy');
    buildFor('girls', 'Girl');
    return result;
  });

  // Count thresholds needed to reach selected ranks for selected years.
  // For each gender/year, this computes the count at exact rank positions.
  eleventyConfig.addGlobalData('rankCountAnalysis', () => {
    const startYear = 1996;
    const targetYears = [1996, 2010, 2024];
    const targetRanks = [1, 10, 50, 100, 250, 500, 750, 1000, 2000, 5000];
    const result = { years: targetYears, ranks: targetRanks, Boy: [], Girl: [] };

    const buildFor = (filename, gender) => {
      const filePath = path.join(__dirname, 'data', `${filename}${dataSuffix}`);
      if (!fs.existsSync(filePath)) return;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      for (const year of targetYears) {
        const yearIndex = year - startYear;
        const counts = [];

        if (yearIndex >= 0) {
          for (const n of data) {
            if (!Array.isArray(n.countFrom1996) || yearIndex >= n.countFrom1996.length) continue;
            const c = parseInt(n.countFrom1996[yearIndex], 10);
            if (!isNaN(c)) counts.push(c);
          }
        }

        counts.sort((a, b) => b - a);
        const yearEntry = { year, counts: {} };

        for (const rank of targetRanks) {
          yearEntry.counts[rank] = rank <= counts.length ? counts[rank - 1] : null;
        }

        result[gender].push(yearEntry);
      }
    };

    buildFor('boys', 'Boy');
    buildFor('girls', 'Girl');
    return result;
  });

  // For each modern year (1996-2024), compute the rank a hypothetical name
  // would achieve for selected baby-count values.
  eleventyConfig.addGlobalData('countToRankAnalysis', () => {
    const startYear = 1996;
    const numYears = 29;
    const targetCounts = [1000, 500, 200, 100, 50, 20];
    const result = { counts: targetCounts, Boy: [], Girl: [] };

    const buildFor = (filename, gender) => {
      const filePath = path.join(__dirname, 'data', `${filename}${dataSuffix}`);
      if (!fs.existsSync(filePath)) return;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const validSeries = data
        .map(n => n.countFrom1996)
        .filter(series => Array.isArray(series) && series.length > 0);

      for (let y = 0; y < numYears; y++) {
        const counts = [];

        for (const series of validSeries) {
          if (y >= series.length) continue;
          const c = parseInt(series[y], 10);
          if (!isNaN(c)) counts.push(c);
        }

        counts.sort((a, b) => b - a);
        const row = { year: startYear + y, ranks: {} };

        for (const targetCount of targetCounts) {
          let higherCounts = 0;
          while (higherCounts < counts.length && counts[higherCounts] > targetCount) {
            higherCounts++;
          }
          row.ranks[targetCount] = higherCounts + 1;
        }

        result[gender].push(row);
      }
    };

    buildFor('boys', 'Boy');
    buildFor('girls', 'Girl');
    return result;
  });

  // Load experiment classification data
  function loadExperimentsData() {
    const experimentsDir = path.join(__dirname, 'experiment-data');
    if (!fs.existsSync(experimentsDir)) return [];

    const experiments = [];

    try {
      fs.readdirSync(experimentsDir).forEach(dirName => {
        const dirPath = path.join(experimentsDir, dirName);
        if (!fs.statSync(dirPath).isDirectory()) return;

        const experimentSlug = dirName;
        const experimentName = dirName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // Tally name counts from boys/girls data files
        const classCounts = {};
        ['boys', 'girls'].forEach(gender => {
          const filePath = path.join(dirPath, `${gender}.json`);
          if (!fs.existsSync(filePath)) return;
          Object.entries(JSON.parse(fs.readFileSync(filePath, 'utf-8'))).forEach(([className, names]) => {
            classCounts[className] = (classCounts[className] || 0) + names.length;
          });
        });

        // Read pre-computed per-class stats (total births, etc.)
        const metadataPath = path.join(dirPath, 'metadata.json');
        const metadata = fs.existsSync(metadataPath)
          ? JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
          : {};

        const classes = Object.keys(classCounts).map(className => ({
          name: className,
          experimentSlug,
          count: classCounts[className],
          totalBirths: metadata[className] ? metadata[className].totalBirths : null
        }));

        experiments.push({ name: experimentName, slug: experimentSlug, classes });
      });
    } catch (e) {
      console.warn('Error loading experiments:', e.message);
    }

    console.log(`Loaded ${experiments.length} experiments`);
    return experiments;
  }

  eleventyConfig.addGlobalData('experiments', loadExperimentsData);

  // Cluster analysis: binary vectors of historic top-100 presence, k-means k=4
  eleventyConfig.addGlobalData('historicClusters', () => {
    const boysPath = path.join(__dirname, 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, 'data', `girls${dataSuffix}`);

    const decades = ['1904', '1914', '1924', '1934', '1944', '1954', '1964', '1974', '1984', '1994', '2004', '2014', '2024'];
    const D = decades.length;

    const entries = [];
    const addEntries = (filePath, gender) => {
      if (!fs.existsSync(filePath)) return;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      for (const n of data) {
        if (typeof n.rank !== 'number' || n.rank < 1 || n.rank > 100) continue;
        if (!Array.isArray(n.rankHistoric) || n.rankHistoric.length !== D) continue;
        const vec = n.rankHistoric.map(v => {
          const r = parseInt(v, 10);
          return (!isNaN(r) && r >= 1 && r <= 100) ? 1 : 0;
        });
        entries.push({
          name: n.name,
          gender,
          uniqueSlug: n.uniqueSlug,
          rank: n.rank,
          vector: vec,
          rankHistoric: n.rankHistoric
        });
      }
    };
    addEntries(boysPath, 'Boy');
    addEntries(girlsPath, 'Girl');

    if (entries.length === 0) {
      console.log('No entries for historic clustering');
      return { clusters: [], decades, total: 0 };
    }

    // Seeded RNG for deterministic k-means++ initialisation
    let rngState = 42;
    const rng = () => {
      rngState = (rngState * 1664525 + 1013904223) >>> 0;
      return rngState / 4294967296;
    };

    const sqDist = (a, b) => {
      let s = 0;
      for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
      return s;
    };

    const K = 4;
    const vectors = entries.map(e => e.vector);
    const N = vectors.length;

    // k-means++ init
    const centroids = [];
    centroids.push(vectors[Math.floor(rng() * N)].slice());
    while (centroids.length < K) {
      const dists = vectors.map(v => Math.min(...centroids.map(c => sqDist(v, c))));
      const total = dists.reduce((a, b) => a + b, 0);
      if (total === 0) {
        centroids.push(vectors[Math.floor(rng() * N)].slice());
        continue;
      }
      let r = rng() * total;
      let idx = 0;
      for (let i = 0; i < N; i++) { r -= dists[i]; if (r <= 0) { idx = i; break; } }
      centroids.push(vectors[idx].slice());
    }

    // Lloyd's algorithm
    const assignments = new Array(N).fill(-1);
    const maxIter = 100;
    for (let iter = 0; iter < maxIter; iter++) {
      let changed = false;
      for (let i = 0; i < N; i++) {
        let best = 0, bestD = sqDist(vectors[i], centroids[0]);
        for (let c = 1; c < K; c++) {
          const d = sqDist(vectors[i], centroids[c]);
          if (d < bestD) { bestD = d; best = c; }
        }
        if (assignments[i] !== best) { assignments[i] = best; changed = true; }
      }
      if (!changed && iter > 0) break;

      for (let c = 0; c < K; c++) {
        const sum = new Array(D).fill(0);
        let count = 0;
        for (let i = 0; i < N; i++) {
          if (assignments[i] !== c) continue;
          for (let j = 0; j < D; j++) sum[j] += vectors[i][j];
          count++;
        }
        if (count === 0) continue;
        for (let j = 0; j < D; j++) sum[j] /= count;
        centroids[c] = sum;
      }
    }

    // Build clusters with sorted names, and a human-readable label from centroid
    const clusters = centroids.map((centroid, c) => {
      const members = [];
      for (let i = 0; i < N; i++) if (assignments[i] === c) members.push(entries[i]);
      members.sort((a, b) => {
        const ra = (a.rank != null) ? a.rank : 1e9;
        const rb = (b.rank != null) ? b.rank : 1e9;
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
      });

      // Label: range of decades where centroid >= 0.5
      const onIdx = centroid.map((v, i) => v >= 0.5 ? i : -1).filter(i => i >= 0);
      let label;
      if (onIdx.length === 0) {
        const peakIdx = centroid.indexOf(Math.max(...centroid));
        label = `Peak ${decades[peakIdx]}s`;
      } else if (onIdx.length === D) {
        label = `Every decade (${decades[0]}–${decades[D - 1]})`;
      } else {
        label = `${decades[onIdx[0]]}–${decades[onIdx[onIdx.length - 1]]}`;
      }

      return {
        index: c,
        label,
        centroid,
        count: members.length,
        members
      };
    });

    // Order clusters by centroid "centre of mass" (earliest average decade first)
    clusters.sort((a, b) => {
      const com = v => {
        let num = 0, den = 0;
        for (let i = 0; i < v.length; i++) { num += i * v[i]; den += v[i]; }
        return den > 0 ? num / den : Infinity;
      };
      return com(a.centroid) - com(b.centroid);
    });
    clusters.forEach((cl, i) => cl.index = i);

    console.log(`Generated ${clusters.length} historic clusters over ${N} names`);
    return { clusters, decades, total: N };
  });

  // Labelled clustering: 3 methods that partition 2024's top 100 into
  // { Classics, Modern classics, Shooting stars, Vintage revival, Pendulums }
  eleventyConfig.addGlobalData('labelledClusters', () => {
    const boysPath = path.join(__dirname, 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, 'data', `girls${dataSuffix}`);

    const decades = ['1904', '1914', '1924', '1934', '1944', '1954', '1964', '1974', '1984', '1994', '2004', '2014', '2024'];
    const D = decades.length;

    const LABELS = ['Classics', 'Modern classics', 'Shooting stars', 'Vintage revival'];
    const LABEL_DESCRIPTIONS = {
      'Classics': 'Consistently popular across the century.',
      'Modern classics': 'Consistently popular in recent decades.',
      'Shooting stars': 'New arrivals to the top 100.',
      'Vintage revival': 'Popular early, disappeared, back again.'
    };

    // ---------- Load and featurise entries ----------
    const entries = [];
    const loadFile = (filePath, gender) => {
      if (!fs.existsSync(filePath)) return;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      for (const n of data) {
        if (typeof n.rank !== 'number' || n.rank < 1 || n.rank > 100) continue;
        if (!Array.isArray(n.rankHistoric) || n.rankHistoric.length !== D) continue;

        const numericRanks = n.rankHistoric.map(v => {
          const r = parseInt(v, 10);
          return isNaN(r) ? null : r;
        });
        const bin100 = numericRanks.map(r => (r !== null && r >= 1 && r <= 100) ? 1 : 0);
        const bin50 = numericRanks.map(r => (r !== null && r >= 1 && r <= 50) ? 1 : 0);
        const ternary = numericRanks.map(r => {
          if (r === null || r > 100) return 0;
          if (r > 50) return 1;
          return 2;
        });

        // Features
        const sumTop100 = bin100.reduce((a, b) => a + b, 0);
        const sumTop50 = bin50.reduce((a, b) => a + b, 0);
        let firstTop100 = bin100.indexOf(1);
        let lastTop100 = bin100.lastIndexOf(1);
        // Longest run of zeros between two ones
        let longestGap = 0;
        if (firstTop100 !== -1 && lastTop100 !== -1 && firstTop100 !== lastTop100) {
          let gap = 0;
          for (let i = firstTop100 + 1; i < lastTop100; i++) {
            if (bin100[i] === 0) { gap++; if (gap > longestGap) longestGap = gap; }
            else gap = 0;
          }
        }
        // Top-50 crossings: transitions between "in top 50" and "not in top 50"
        let top50Crossings = 0;
        for (let i = 1; i < D; i++) {
          if (bin50[i] !== bin50[i - 1]) top50Crossings++;
        }

        entries.push({
          name: n.name,
          gender,
          uniqueSlug: n.uniqueSlug,
          rank: n.rank,
          bin100,
          bin50,
          ternary,
          features: {
            sumTop100, sumTop50, firstTop100, lastTop100, longestGap, top50Crossings
          }
        });
      }
    };
    loadFile(boysPath, 'Boy');
    loadFile(girlsPath, 'Girl');

    if (entries.length === 0) {
      return { decades, labels: LABELS, descriptions: LABEL_DESCRIPTIONS, methods: [], total: 0 };
    }

    const sortMembers = arr => arr.slice().sort((a, b) => {
      const ra = a.rank ?? 1e9, rb = b.rank ?? 1e9;
      return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
    });

    // ---------- Method A: priority-ordered rules ----------
    const assignA = (e) => {
      const f = e.features;
      const bin = e.bin100;
      // Shooting star: only recent (last 2 decades) and ≤1 earlier appearance
      const earlyCount = bin.slice(0, D - 2).reduce((a, b) => a + b, 0);
      const recentCount = bin.slice(D - 2).reduce((a, b) => a + b, 0);
      if (recentCount >= 1 && earlyCount <= 1 && f.sumTop100 <= 2) return 'Shooting stars';
      // Vintage revival: early presence (1904–1934 = indices 0..3), gap in mid (1944–1984 = 4..8), recent presence (1994+ = 9..12)
      const earlyHit = bin.slice(0, 4).some(b => b === 1);
      const midHit = bin.slice(4, 9).some(b => b === 1);
      const recentHit = bin.slice(9).some(b => b === 1);
      if (earlyHit && !midHit && recentHit) return 'Vintage revival';
      // Classic: top 100 in ≥10 of 13 decades
      if (f.sumTop100 >= 10) return 'Classics';
      // Fallback: modern classic
      return 'Modern classics';
    };

    // ---------- Method B: nearest prototype in ternary decade space ----------
    const prototypesB = {
      'Classics':         [2,2,2,2,2,2,2,2,2,2,2,2,2],
      'Modern classics':  [0,0,0,0,0,0,0,0,1,1,2,2,2],
      'Shooting stars':   [0,0,0,0,0,0,0,0,0,0,0,0,2],
      'Vintage revival':  [2,2,2,1,0,0,0,0,0,0,1,2,2]
    };
    const sqDist = (a, b) => {
      let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return s;
    };
    const assignB = (e) => {
      let bestLabel = LABELS[0], bestD = Infinity;
      for (const label of LABELS) {
        const d = sqDist(e.ternary, prototypesB[label]);
        if (d < bestD) { bestD = d; bestLabel = label; }
      }
      return bestLabel;
    };

    // ---------- Method C: k-means in engineered feature space, prototype-seeded ----------
    // Feature vector per name: [sumTop100/13, sumTop50/13, firstTop100/12 (or 1), lastTop100/12 (or 0), longestGap/13]
    const toFeature = (e) => {
      const f = e.features;
      return [
        f.sumTop100 / 13,
        f.sumTop50 / 13,
        (f.firstTop100 === -1) ? 1 : f.firstTop100 / 12,
        (f.lastTop100 === -1) ? 0 : f.lastTop100 / 12,
        f.longestGap / 13
      ];
    };
    const featureVectors = entries.map(toFeature);
    const initialCentroidsC = {
      'Classics':         [1.00, 0.70, 0.00, 1.00, 0.00],
      'Modern classics':  [0.40, 0.30, 0.60, 1.00, 0.00],
      'Shooting stars':   [0.10, 0.00, 1.00, 1.00, 0.00],
      'Vintage revival':  [0.30, 0.15, 0.00, 1.00, 0.60]
    };
    const orderedLabels = LABELS;
    const centroidsC = orderedLabels.map(l => initialCentroidsC[l].slice());
    const Nc = featureVectors.length;
    const Kc = orderedLabels.length;
    const assignmentsC = new Array(Nc).fill(-1);
    for (let iter = 0; iter < 100; iter++) {
      let changed = false;
      for (let i = 0; i < Nc; i++) {
        let best = 0, bestD = sqDist(featureVectors[i], centroidsC[0]);
        for (let c = 1; c < Kc; c++) {
          const d = sqDist(featureVectors[i], centroidsC[c]);
          if (d < bestD) { bestD = d; best = c; }
        }
        if (assignmentsC[i] !== best) { assignmentsC[i] = best; changed = true; }
      }
      if (!changed && iter > 0) break;
      for (let c = 0; c < Kc; c++) {
        const sum = new Array(featureVectors[0].length).fill(0);
        let count = 0;
        for (let i = 0; i < Nc; i++) {
          if (assignmentsC[i] !== c) continue;
          for (let j = 0; j < sum.length; j++) sum[j] += featureVectors[i][j];
          count++;
        }
        if (count === 0) continue;
        for (let j = 0; j < sum.length; j++) sum[j] /= count;
        centroidsC[c] = sum;
      }
    }

    // ---------- Build output for a method ----------
    const buildMethod = (name, description, assignments) => {
      const groups = {};
      for (const label of LABELS) groups[label] = [];
      entries.forEach((e, i) => groups[assignments[i]].push(e));
      const clusters = LABELS.map(label => {
        const members = sortMembers(groups[label]);
        const centroid = new Array(D).fill(0);
        if (members.length > 0) {
          for (const m of members) for (let j = 0; j < D; j++) centroid[j] += m.bin100[j];
          for (let j = 0; j < D; j++) centroid[j] /= members.length;
        }
        return {
          label,
          description: LABEL_DESCRIPTIONS[label],
          count: members.length,
          centroid,
          members
        };
      });
      return { name, description, clusters };
    };

    const assignmentsA = entries.map(assignA);
    const assignmentsB = entries.map(assignB);
    const assignmentsC_labels = assignmentsC.map(i => orderedLabels[i]);

    const methods = [
      buildMethod(
        'Method 1 — Priority-ordered rules',
        'A decision list evaluated top to bottom. Each name takes the first rule it matches: only-recent → Shooting star; early + recent with a mid-century gap → Vintage revival; ≥10 of 13 decades in the top 100 → Classic; everything else → Modern classic.',
        assignmentsA
      ),
      buildMethod(
        'Method 2 — Nearest prototype (ternary decades)',
        'Each decade is encoded as 0 (outside top 100), 1 (51–100) or 2 (top 50). Each category has a hand-crafted prototype vector of this shape, and every name is assigned to the prototype it is closest to by Euclidean distance.',
        assignmentsB
      ),
      buildMethod(
        'Method 3 — Feature-space k-means (prototype-seeded)',
        'Five summary features per name (share in top 100, share in top 50, first top-100 decade, last top-100 decade, longest gap between top-100 decades). K-means is run with k=4 using labelled prototype centroids as the initial seeds, so each converged cluster keeps its intended label.',
        assignmentsC_labels
      )
    ];

    console.log(`Labelled clustering computed over ${entries.length} names across ${methods.length} methods`);
    return { decades, labels: LABELS, descriptions: LABEL_DESCRIPTIONS, methods, total: entries.length };
  });

  // Faded names: historic top-100 names that are unranked in the 2024 decade
  eleventyConfig.addGlobalData('fadedNames', () => {
    const boysPath = path.join(__dirname, 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, 'data', `girls${dataSuffix}`);

    const decades = ['1904', '1914', '1924', '1934', '1944', '1954', '1964', '1974', '1984', '1994', '2004', '2014', '2024'];
    const D = decades.length;

    const LABELS = ['Past classics', 'Golden generation', 'Past stars', 'Of a time', 'Past revival'];
    const LABEL_DESCRIPTIONS = {
      'Past classics':     'Consistently popular for decades, now fallen out of the top 100.',
      'Golden generation': 'Only popular in the first decades of the twentieth century.',
      'Past stars':        'A short spell in the top 100; now gone.',
      'Of a time':         'Several consecutive decades in the top 100.',
      'Past revival':      'Popular early, came back for a revival, out of favour now.'
    };

    // ---------- Load, filter, featurise ----------
    const entries = [];
    const loadFile = (filePath, gender) => {
      if (!fs.existsSync(filePath)) return;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      for (const n of data) {
        if (!Array.isArray(n.rankHistoric) || n.rankHistoric.length !== D) continue;
        // 2024 must be unranked (rankHistoric only records top-100, so "x" means outside)
        if (n.rankHistoric[D - 1] !== 'x') continue;
        const numericRanks = n.rankHistoric.map(v => {
          const r = parseInt(v, 10);
          return isNaN(r) ? null : r;
        });
        // Needs at least one historic top-100 decade
        if (!numericRanks.some(r => r !== null && r >= 1 && r <= 100)) continue;

        const bin100 = numericRanks.map(r => (r !== null && r >= 1 && r <= 100) ? 1 : 0);
        const bin30 = numericRanks.map(r => (r !== null && r >= 1 && r <= 30) ? 1 : 0);
        // Tri-level encoding: 0 outside top 100, 1 in 31–100, 2 in 1–30
        const ternary = numericRanks.map(r => {
          if (r === null || r < 1 || r > 100) return 0;
          return (r <= 30) ? 2 : 1;
        });

        const sumTop100 = bin100.reduce((a, b) => a + b, 0);
        const sumTop30 = bin30.reduce((a, b) => a + b, 0);
        let firstTop100 = bin100.indexOf(1);
        let lastTop100 = bin100.lastIndexOf(1);
        let longestGap = 0;
        if (firstTop100 !== -1 && lastTop100 !== -1 && firstTop100 !== lastTop100) {
          let gap = 0;
          for (let i = firstTop100 + 1; i < lastTop100; i++) {
            if (bin100[i] === 0) { gap++; if (gap > longestGap) longestGap = gap; }
            else gap = 0;
          }
        }

        entries.push({
          name: n.name,
          gender,
          uniqueSlug: n.uniqueSlug,
          bin100,
          bin30,
          ternary,
          ranks: numericRanks,
          features: { sumTop100, sumTop30, firstTop100, lastTop100, longestGap }
        });
      }
    };
    loadFile(boysPath, 'Boy');
    loadFile(girlsPath, 'Girl');

    if (entries.length === 0) {
      return { decades, labels: LABELS, descriptions: LABEL_DESCRIPTIONS, methods: [], total: 0, all: [] };
    }

    const sortByArc = arr => arr.slice().sort((a, b) => {
      const fa = a.features.firstTop100, fb = b.features.firstTop100;
      if (fa !== fb) return fa - fb;
      const la = a.features.lastTop100, lb = b.features.lastTop100;
      if (la !== lb) return la - lb;
      return a.name.localeCompare(b.name);
    });
    const sortAlpha = arr => arr.slice().sort((a, b) => a.name.localeCompare(b.name));

    const sqDist = (a, b) => {
      let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return s;
    };

    // ---------- Method A: priority-ordered rules ----------
    const assignA = (e) => {
      const f = e.features;
      const bin = e.bin100;
      const earlyHit = bin.slice(0, 4).some(b => b === 1);   // 1904–1934
      const lateHit  = bin.slice(8, 12).some(b => b === 1);  // 1984–2014
      const postEarly = bin.slice(5, 13).some(b => b === 1); // 1954–2024

      // 1. Past revival: early AND late top-100 presence, with a clear gap
      if (earlyHit && lateHit && f.longestGap >= 3) return 'Past revival';
      // 2. Past classics: many decades in top 100, with small gaps
      if (f.sumTop100 >= 6 && f.longestGap <= 2) return 'Past classics';
      // 3. Golden generation: only popular in the first decades of the twentieth century (1904–1944)
      if (!postEarly && earlyHit) return 'Golden generation';
      // 4. Of a time: 3+ decades in top 100 but not matching the above
      if (f.sumTop100 >= 3) return 'Of a time';
      // 5. Past stars: short burst
      return 'Past stars';
    };

    // ---------- Method B: nearest prototype in ternary decade space ----------
    //                    1904 1914 1924 1934 1944 1954 1964 1974 1984 1994 2004 2014 2024
    const prototypesB = {
      'Past classics':    [2,   2,   2,   2,   2,   2,   2,   1,   1,   1,   0,   0,   0],
      'Golden generation':[2,   2,   2,   2,   1,   0,   0,   0,   0,   0,   0,   0,   0],
      'Past stars':       [0,   0,   0,   0,   0,   0,   0,   0,   1,   2,   1,   0,   0],
      'Of a time':        [0,   0,   0,   1,   2,   2,   2,   1,   0,   0,   0,   0,   0],
      'Past revival':     [2,   2,   1,   0,   0,   0,   0,   0,   1,   2,   2,   0,   0]
    };
    const assignB = (e) => {
      let bestLabel = LABELS[0], bestD = Infinity;
      for (const label of LABELS) {
        const d = sqDist(e.ternary, prototypesB[label]);
        if (d < bestD) { bestD = d; bestLabel = label; }
      }
      return bestLabel;
    };

    // ---------- Method C: k-means in engineered feature space, prototype-seeded ----------
    // Features: [sumTop100/12, firstTop100/11 (1 if none), lastTop100/11 (0 if none), longestGap/12, span/11]
    const toFeature = (e) => {
      const f = e.features;
      const first = (f.firstTop100 === -1) ? 11 : f.firstTop100;
      const last  = (f.lastTop100  === -1) ? 0  : f.lastTop100;
      const span  = (f.firstTop100 === -1 || f.lastTop100 === -1) ? 0 : (f.lastTop100 - f.firstTop100);
      return [
        f.sumTop100 / 12,
        first / 11,
        last / 11,
        f.longestGap / 12,
        span / 11
      ];
    };
    const featureVectors = entries.map(toFeature);
    const initialCentroidsC = {
      'Past classics':    [0.70, 0.00, 0.85, 0.10, 0.80],
      'Golden generation':[0.30, 0.00, 0.30, 0.00, 0.30],
      'Past stars':       [0.12, 0.70, 0.75, 0.00, 0.05],
      'Of a time':        [0.30, 0.35, 0.60, 0.00, 0.30],
      'Past revival':     [0.55, 0.05, 0.90, 0.40, 0.85]
    };
    const orderedLabels = LABELS;
    const centroidsC = orderedLabels.map(l => initialCentroidsC[l].slice());
    const Nc = featureVectors.length;
    const Kc = orderedLabels.length;
    const assignmentsC = new Array(Nc).fill(-1);
    for (let iter = 0; iter < 100; iter++) {
      let changed = false;
      for (let i = 0; i < Nc; i++) {
        let best = 0, bestD = sqDist(featureVectors[i], centroidsC[0]);
        for (let c = 1; c < Kc; c++) {
          const d = sqDist(featureVectors[i], centroidsC[c]);
          if (d < bestD) { bestD = d; best = c; }
        }
        if (assignmentsC[i] !== best) { assignmentsC[i] = best; changed = true; }
      }
      if (!changed && iter > 0) break;
      for (let c = 0; c < Kc; c++) {
        const sum = new Array(featureVectors[0].length).fill(0);
        let count = 0;
        for (let i = 0; i < Nc; i++) {
          if (assignmentsC[i] !== c) continue;
          for (let j = 0; j < sum.length; j++) sum[j] += featureVectors[i][j];
          count++;
        }
        if (count === 0) continue;
        for (let j = 0; j < sum.length; j++) sum[j] /= count;
        centroidsC[c] = sum;
      }
    }

    // ---------- Build method output ----------
    const buildMethod = (name, description, assignments) => {
      const groups = {};
      for (const label of LABELS) groups[label] = [];
      entries.forEach((e, i) => groups[assignments[i]].push(e));
      const clusters = LABELS.map(label => {
        const members = sortByArc(groups[label]);
        const centroid = new Array(D).fill(0);
        if (members.length > 0) {
          for (const m of members) for (let j = 0; j < D; j++) centroid[j] += m.bin100[j];
          for (let j = 0; j < D; j++) centroid[j] /= members.length;
        }
        return {
          label,
          description: LABEL_DESCRIPTIONS[label],
          count: members.length,
          centroid,
          members
        };
      });
      return { name, description, clusters };
    };

    const assignmentsA = entries.map(assignA);
    const assignmentsB = entries.map(assignB);
    const assignmentsC_labels = assignmentsC.map(i => orderedLabels[i]);

    // ---------- Hybrid rules shared by Methods 4 and 5 ----------
    const hybridRule = (e) => {
      const bin = e.bin100;
      const f = e.features;
      const anyAfter1934 = bin.slice(4).some(b => b === 1);
      if (!anyAfter1934) return 'Golden generation';
      if (f.sumTop100 === 1) return 'Past stars';
      if (f.sumTop100 === 2 && (f.lastTop100 - f.firstTop100) === 1) return 'Past stars';
      return null;
    };

    // ---------- Method D: hybrid rules + nearest prototype for the remainder ----------
    const remainingLabels = ['Past classics', 'Of a time', 'Past revival'];
    const assignD = (e) => {
      const ruled = hybridRule(e);
      if (ruled) return ruled;
      let bestLabel = remainingLabels[0], bestD = Infinity;
      for (const label of remainingLabels) {
        const d = sqDist(e.ternary, prototypesB[label]);
        if (d < bestD) { bestD = d; bestLabel = label; }
      }
      return bestLabel;
    };
    const assignmentsD = entries.map(assignD);

    // ---------- Method E: hybrid rules + k-means on remainder in feature space ----------
    const remainingIndices = [];
    const assignmentsE = new Array(entries.length);
    entries.forEach((e, i) => {
      const ruled = hybridRule(e);
      if (ruled) assignmentsE[i] = ruled;
      else remainingIndices.push(i);
    });
    if (remainingIndices.length > 0) {
      const Ke = remainingLabels.length;
      const centroidsE = remainingLabels.map(l => initialCentroidsC[l].slice());
      const subAssign = new Array(remainingIndices.length).fill(-1);
      for (let iter = 0; iter < 100; iter++) {
        let changed = false;
        for (let k = 0; k < remainingIndices.length; k++) {
          const fv = featureVectors[remainingIndices[k]];
          let best = 0, bestD = sqDist(fv, centroidsE[0]);
          for (let c = 1; c < Ke; c++) {
            const d = sqDist(fv, centroidsE[c]);
            if (d < bestD) { bestD = d; best = c; }
          }
          if (subAssign[k] !== best) { subAssign[k] = best; changed = true; }
        }
        if (!changed && iter > 0) break;
        for (let c = 0; c < Ke; c++) {
          const sum = new Array(featureVectors[0].length).fill(0);
          let count = 0;
          for (let k = 0; k < remainingIndices.length; k++) {
            if (subAssign[k] !== c) continue;
            const fv = featureVectors[remainingIndices[k]];
            for (let j = 0; j < sum.length; j++) sum[j] += fv[j];
            count++;
          }
          if (count === 0) continue;
          for (let j = 0; j < sum.length; j++) sum[j] /= count;
          centroidsE[c] = sum;
        }
      }
      for (let k = 0; k < remainingIndices.length; k++) {
        assignmentsE[remainingIndices[k]] = remainingLabels[subAssign[k]];
      }
    }

    const methods = [
      buildMethod(
        'Method 1 — Priority-ordered rules',
        'A decision list evaluated top to bottom on each name: early + late top-100 presence with a gap of 3+ empty decades → Past revival; ≥6 decades in the top 100 with gaps no longer than 1 decade → Past classic; only ever top 100 in the first five decades (1904–1944) → Golden generation; 3+ decades in the top 100 otherwise → Of a time; everything else → Past star.',
        assignmentsA
      ),
      buildMethod(
        'Method 2 — Nearest prototype (ternary decades)',
        'Each decade is encoded as 0 (outside top 100), 1 (31–100) or 2 (top 30). Each label has a hand-crafted 13-decade prototype vector of this shape, and every name is assigned to the prototype it is closest to by Euclidean distance.',
        assignmentsB
      ),
      buildMethod(
        'Method 3 — Feature-space k-means (prototype-seeded)',
        'Five features per name (share in top 100, first/last top-100 decade, longest gap between top-100 decades, span from first to last). K-means with k=5 is seeded by labelled prototype centroids, so each converged cluster keeps its intended label.',
        assignmentsC_labels
      ),
      buildMethod(
        'Method 4 — Hybrid rules + nearest prototype',
        'Two priority rules run first: (1) if a name is never in the top 100 after 1934 it is Golden generation; (2) if it has just one top-100 decade, or two consecutive decades, it is a Past star. Every remaining name is assigned to its closest ternary-decade prototype among Past classics, Of a time and Past revival.',
        assignmentsD
      ),
      buildMethod(
        'Method 5 — Hybrid rules + k-means on remainder',
        'The same two priority rules assign the clear-cut Golden generation and Past star cases. The remaining names are clustered with k-means (k=3) in the same 5-feature space as Method 3, seeded by the Past classics / Of a time / Past revival prototypes so each converged cluster keeps its intended label.',
        assignmentsE
      )
    ];

    const all = sortByArc(entries);

    console.log(`Faded names: ${entries.length} names clustered via ${methods.length} methods`);
    return { decades, labels: LABELS, descriptions: LABEL_DESCRIPTIONS, methods, total: entries.length, all };
  });

  // Generate search index after build
  eleventyConfig.on('eleventy.after', async () => {
    const boysPath = path.join(__dirname, 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, 'data', `girls${dataSuffix}`);
    const outputPath = path.join(__dirname, '_site', 'search-index.json');

    let searchIndex = [];

    // Load boys names
    if (fs.existsSync(boysPath)) {
      const boysData = JSON.parse(fs.readFileSync(boysPath, 'utf-8'));
      boysData.forEach(name => {
        searchIndex.push({
          name: name.name,
          slug: name.uniqueSlug,
          gender: 'boy',
          rank: name.rank
        });
      });
    }

    // Load girls names
    if (fs.existsSync(girlsPath)) {
      const girlsData = JSON.parse(fs.readFileSync(girlsPath, 'utf-8'));
      girlsData.forEach(name => {
        searchIndex.push({
          name: name.name,
          slug: name.uniqueSlug,
          gender: 'girl',
          rank: name.rank
        });
      });
    }

    // Write search index to _site directory
    fs.writeFileSync(outputPath, JSON.stringify(searchIndex), 'utf-8');
    console.log(`Generated search index with ${searchIndex.length} names`);
  });

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: 'templates',
      layouts: 'templates',
      data: '../data'
    },
    templateFormats: ['njk', 'md', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    serverOptions: {
      port: 1872
    }
  };
};
