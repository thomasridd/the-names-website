const fs = require('fs');
const path = require('path');

function registerSearchIndex(eleventyConfig, dataSuffix) {
  eleventyConfig.on('eleventy.after', async () => {
    const boysPath = path.join(__dirname, '..', 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, '..', 'data', `girls${dataSuffix}`);
    const outputPath = path.join(__dirname, '..', '_site', 'search-index.json');

    let searchIndex = [];

    if (fs.existsSync(boysPath)) {
      const boysData = JSON.parse(fs.readFileSync(boysPath, 'utf-8'));
      boysData.forEach(name => {
        searchIndex.push({ name: name.name, slug: name.uniqueSlug, gender: 'boy', rank: name.rank });
      });
    }

    if (fs.existsSync(girlsPath)) {
      const girlsData = JSON.parse(fs.readFileSync(girlsPath, 'utf-8'));
      girlsData.forEach(name => {
        searchIndex.push({ name: name.name, slug: name.uniqueSlug, gender: 'girl', rank: name.rank });
      });
    }

    fs.writeFileSync(outputPath, JSON.stringify(searchIndex), 'utf-8');
    console.log(`Generated search index with ${searchIndex.length} names`);
  });
}

module.exports = { registerSearchIndex };
