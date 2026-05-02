function registerFilters(eleventyConfig) {
  eleventyConfig.addFilter('filterByGender', function(array, gender) {
    return array.filter(item => item.gender === gender);
  });

  eleventyConfig.addFilter('formatNumber', n => n == null ? '-' : n.toLocaleString('en-GB'));
}

module.exports = { registerFilters };
