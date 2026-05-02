const fs = require('fs');
const path = require('path');

function registerRankAnalysis(eleventyConfig, dataSuffix) {
  eleventyConfig.addGlobalData('rankCountGuidelines', () => {
    const thresholds = [10, 50, 100, 500, 1000, 5000];
    const startYear = 1996;
    const numYears = 29;
    const result = { Boy: [], Girl: [], thresholds };

    const buildFor = (filename, gender) => {
      const filePath = path.join(__dirname, '..', 'data', `${filename}${dataSuffix}`);
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

  eleventyConfig.addGlobalData('rankCountAnalysis', () => {
    const startYear = 1996;
    const targetYears = [1996, 2010, 2024];
    const targetRanks = [1, 10, 50, 100, 250, 500, 750, 1000, 2000, 5000];
    const result = { years: targetYears, ranks: targetRanks, Boy: [], Girl: [] };

    const buildFor = (filename, gender) => {
      const filePath = path.join(__dirname, '..', 'data', `${filename}${dataSuffix}`);
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

  eleventyConfig.addGlobalData('countToRankAnalysis', () => {
    const startYear = 1996;
    const numYears = 29;
    const targetCounts = [105, 100, 95, 55, 50, 45, 25, 20, 15];
    const result = { counts: targetCounts, Boy: [], Girl: [] };

    const buildFor = (filename, gender) => {
      const filePath = path.join(__dirname, '..', 'data', `${filename}${dataSuffix}`);
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
}

module.exports = { registerRankAnalysis };
