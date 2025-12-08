const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

module.exports = function(eleventyConfig) {
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

  // Load JSON data for all names (boys + girls)
  eleventyConfig.addGlobalData('allNames', () => {
    const boysPath = path.join(__dirname, 'data', 'boys.json');
    const girlsPath = path.join(__dirname, 'data', 'girls.json');

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
    return { recent: {}, historic: {} };
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
    htmlTemplateEngine: 'njk'
  };
};
