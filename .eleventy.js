const { detectBuildMode } = require('./config/build-mode');
const { registerFilters } = require('./config/filters');
const { registerGlobalData } = require('./config/global-data');
const { registerRankAnalysis } = require('./config/rank-analysis');
const { registerAnalysisClusters } = require('./config/analysis-clusters');
const { registerSearchIndex } = require('./config/search-index');

module.exports = function(eleventyConfig) {
  const { dataSuffix } = detectBuildMode();

  eleventyConfig.addPassthroughCopy('src/scripts');
  eleventyConfig.addPassthroughCopy('src/assets');

  registerFilters(eleventyConfig);
  registerGlobalData(eleventyConfig, dataSuffix);
  registerRankAnalysis(eleventyConfig, dataSuffix);
  registerAnalysisClusters(eleventyConfig, dataSuffix);
  registerSearchIndex(eleventyConfig, dataSuffix);

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
