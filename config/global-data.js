const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function registerGlobalData(eleventyConfig, dataSuffix) {
  eleventyConfig.addGlobalData('allNames', () => {
    const boysPath = path.join(__dirname, '..', 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, '..', 'data', `girls${dataSuffix}`);

    let allNames = [];

    if (fs.existsSync(boysPath)) {
      const boysData = JSON.parse(fs.readFileSync(boysPath, 'utf-8'));
      allNames = allNames.concat(boysData.map(name => ({ ...name, gender: 'Boy' })));
      console.log(`Loaded ${boysData.length} boys names`);
    }

    if (fs.existsSync(girlsPath)) {
      const girlsData = JSON.parse(fs.readFileSync(girlsPath, 'utf-8'));
      allNames = allNames.concat(girlsData.map(name => ({ ...name, gender: 'Girl' })));
      console.log(`Loaded ${girlsData.length} girls names`);
    }

    const nameMap = new Map();
    allNames.forEach(name => {
      nameMap.set(`${name.name.toLowerCase()}-${name.gender}`, name);
    });

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

  eleventyConfig.addGlobalData('names', () => {
    const csvPath = path.join(__dirname, '..', 'data', 'names.csv');

    if (!fs.existsSync(csvPath)) {
      console.warn('Warning: names.csv not found. Using empty array for homepage names.');
      return [];
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    return parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
  });

  eleventyConfig.addGlobalData('siteConfig', () => ({
    title: 'The Names Website',
    description: 'A website for thinking about names'
  }));

  eleventyConfig.addGlobalData('classificationDescriptions', () => {
    const descriptionsPath = path.join(__dirname, '..', 'data', 'classification-descriptions.json');
    if (fs.existsSync(descriptionsPath)) {
      return JSON.parse(fs.readFileSync(descriptionsPath, 'utf-8'));
    }
    return { five_year: {}, recent: {}, historic: {} };
  });

  eleventyConfig.addGlobalData('classifications', () => {
    const boysPath = path.join(__dirname, '..', 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, '..', 'data', `girls${dataSuffix}`);
    const descriptionsPath = path.join(__dirname, '..', 'data', 'classification-descriptions.json');

    let allNames = [];
    if (fs.existsSync(boysPath)) {
      allNames = allNames.concat(
        JSON.parse(fs.readFileSync(boysPath, 'utf-8')).map(n => ({ ...n, gender: 'Boy' }))
      );
    }
    if (fs.existsSync(girlsPath)) {
      allNames = allNames.concat(
        JSON.parse(fs.readFileSync(girlsPath, 'utf-8')).map(n => ({ ...n, gender: 'Girl' }))
      );
    }

    let descriptions = { five_year: {}, recent: {}, historic: {} };
    if (fs.existsSync(descriptionsPath)) {
      descriptions = JSON.parse(fs.readFileSync(descriptionsPath, 'utf-8'));
    }

    const classifications = [];

    const processGroup = (type, period, descMap) => {
      const groups = {};
      allNames.forEach(name => {
        const label = name.classifications && name.classifications[type];
        if (label) {
          if (!groups[label]) groups[label] = [];
          groups[label].push(name);
        }
      });
      Object.keys(groups).forEach(classificationName => {
        classifications.push({
          name: classificationName,
          slug: createSlug(classificationName),
          type,
          period,
          description: descMap[classificationName] || '',
          names: groups[classificationName],
          count: groups[classificationName].length
        });
      });
    };

    processGroup('five_year', '2020-2024', descriptions.five_year);
    processGroup('recent', '1996-2024', descriptions.recent);
    processGroup('historic', '1904-2024', descriptions.historic);

    console.log(`Generated ${classifications.length} classification pages`);
    return classifications;
  });

  eleventyConfig.addGlobalData('experiments', () => {
    const experimentsDir = path.join(__dirname, '..', 'experiment-data');
    if (!fs.existsSync(experimentsDir)) return [];

    const experiments = [];
    try {
      fs.readdirSync(experimentsDir).forEach(dirName => {
        const dirPath = path.join(experimentsDir, dirName);
        if (!fs.statSync(dirPath).isDirectory()) return;

        const experimentSlug = dirName;
        const experimentName = dirName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        const classCounts = {};
        ['boys', 'girls'].forEach(gender => {
          const filePath = path.join(dirPath, `${gender}.json`);
          if (!fs.existsSync(filePath)) return;
          Object.entries(JSON.parse(fs.readFileSync(filePath, 'utf-8'))).forEach(([className, names]) => {
            classCounts[className] = (classCounts[className] || 0) + names.length;
          });
        });

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
  });
}

module.exports = { registerGlobalData };
