const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

module.exports = function(eleventyConfig) {
  // Pass through static assets
  eleventyConfig.addPassthroughCopy('src/styles');
  eleventyConfig.addPassthroughCopy('src/scripts');
  eleventyConfig.addPassthroughCopy('src/assets');

  // Load CSV data as global data
  eleventyConfig.addGlobalData('names', () => {
    const csvPath = path.join(__dirname, 'data', 'names.csv');

    // Check if CSV file exists
    if (!fs.existsSync(csvPath)) {
      console.warn('Warning: names.csv not found. No name data will be available.');
      return [];
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    return records;
  });

  // Load YAML config if it exists
  eleventyConfig.addGlobalData('siteConfig', () => {
    const configPath = path.join(__dirname, 'data', 'config.yaml');

    if (!fs.existsSync(configPath)) {
      // Return default config if file doesn't exist
      return {
        title: 'The Names Website',
        description: 'A website for thinking about names'
      };
    }

    // For now, return default config
    // You can add yaml parsing library later if needed
    return {
      title: 'The Names Website',
      description: 'A website for thinking about names'
    };
  });

  // Create a collection of name pages from CSV data
  eleventyConfig.addCollection('namePages', (collectionApi) => {
    const names = eleventyConfig.globalData.names();

    return names.map((nameData, index) => {
      return {
        data: {
          name: nameData.name,
          ...nameData,
          permalink: `/names/${nameData.name.toLowerCase().replace(/\s+/g, '-')}/index.html`,
          layout: 'name.njk'
        },
        page: {
          url: `/names/${nameData.name.toLowerCase().replace(/\s+/g, '-')}/`,
          inputPath: `virtual-names-${index}`,
          outputPath: `_site/names/${nameData.name.toLowerCase().replace(/\s+/g, '-')}/index.html`
        }
      };
    });
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
