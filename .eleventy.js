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
