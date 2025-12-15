#!/usr/bin/env node

/**
 * Update recentClassification in boys.json and girls.json based on cluster analysis
 *
 * Process:
 * 1. Look up name in popular_names_500/name_features.csv
 * 2. Get cluster_kmeans value
 * 3. Look up archetype in popular_names_500/archetypes.csv
 * 4. If not found, try unpopular_names_below_500/
 * 5. If still not found, assign "Uncategorized recent pattern"
 */

const fs = require('fs');
const path = require('path');

// Paths
const POPULAR_FEATURES = 'analysis_output/popular_names_500/name_features.csv';
const POPULAR_ARCHETYPES = 'analysis_output/popular_names_500/archetypes.csv';
const UNPOPULAR_FEATURES = 'analysis_output/unpopular_names_below_500/name_features.csv';
const UNPOPULAR_ARCHETYPES = 'analysis_output/unpopular_names_below_500/archetypes.csv';
const BOYS_JSON = 'data/boys.json';
const GIRLS_JSON = 'data/girls.json';

/**
 * Parse CSV file to array of objects
 */
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map(line => {
        // Handle quoted values
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current); // Last value

        const obj = {};
        headers.forEach((header, i) => {
            obj[header.trim()] = values[i] ? values[i].trim() : '';
        });
        return obj;
    });
}

/**
 * Build lookup maps
 */
function buildClassificationMaps() {
    console.log('Loading classification data...');

    // Load archetypes
    const popularArchetypes = parseCSV(POPULAR_ARCHETYPES);
    const unpopularArchetypes = parseCSV(UNPOPULAR_ARCHETYPES);

    // Create cluster -> archetype maps
    const popularClusterMap = {};
    popularArchetypes.forEach(row => {
        popularClusterMap[row.cluster] = row.archetype;
    });

    const unpopularClusterMap = {};
    unpopularArchetypes.forEach(row => {
        unpopularClusterMap[row.cluster] = row.archetype;
    });

    // Load features and create name -> archetype maps
    const popularFeatures = parseCSV(POPULAR_FEATURES);
    const unpopularFeatures = parseCSV(UNPOPULAR_FEATURES);

    const popularNameMap = {};
    popularFeatures.forEach(row => {
        const key = `${row.name}|${row.gender}`;
        const cluster = row.cluster_kmeans;
        popularNameMap[key] = popularClusterMap[cluster];
    });

    const unpopularNameMap = {};
    unpopularFeatures.forEach(row => {
        const key = `${row.name}|${row.gender}`;
        const cluster = row.cluster_kmeans;
        unpopularNameMap[key] = unpopularClusterMap[cluster];
    });

    console.log(`Loaded ${Object.keys(popularNameMap).length} popular names`);
    console.log(`Loaded ${Object.keys(unpopularNameMap).length} unpopular names`);

    return { popularNameMap, unpopularNameMap };
}

/**
 * Look up classification for a name
 */
function getClassification(name, gender, popularNameMap, unpopularNameMap) {
    const key = `${name}|${gender}`;

    // Try popular first
    if (popularNameMap[key]) {
        return popularNameMap[key];
    }

    // Try unpopular
    if (unpopularNameMap[key]) {
        return unpopularNameMap[key];
    }

    // Not found
    return 'Uncategorized recent pattern';
}

/**
 * Update classifications in a JSON file
 */
function updateClassifications(filePath, gender, popularNameMap, unpopularNameMap) {
    console.log(`\nUpdating ${filePath}...`);

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const stats = {
        total: data.length,
        updated: 0,
        uncategorized: 0,
        distributions: {}
    };

    data.forEach(nameData => {
        const oldClassification = nameData.recentClassification;
        const newClassification = getClassification(nameData.name, gender, popularNameMap, unpopularNameMap);

        nameData.recentClassification = newClassification;

        // Track stats
        if (oldClassification !== newClassification) {
            stats.updated++;
        }
        if (newClassification === 'Uncategorized recent pattern') {
            stats.uncategorized++;
        }

        stats.distributions[newClassification] = (stats.distributions[newClassification] || 0) + 1;
    });

    // Save updated file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`Total names: ${stats.total}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Uncategorized: ${stats.uncategorized}`);
    console.log('\nClassification distribution:');
    Object.entries(stats.distributions)
        .sort((a, b) => b[1] - a[1])
        .forEach(([classification, count]) => {
            const pct = ((count / stats.total) * 100).toFixed(1);
            console.log(`  ${classification}: ${count} (${pct}%)`);
        });

    return stats;
}

/**
 * Main execution
 */
function main() {
    console.log('='.repeat(80));
    console.log('Updating Recent Classifications from Cluster Analysis');
    console.log('='.repeat(80));

    try {
        // Build classification maps
        const { popularNameMap, unpopularNameMap } = buildClassificationMaps();

        // Update boys.json
        const boysStats = updateClassifications(BOYS_JSON, 'Boy', popularNameMap, unpopularNameMap);

        // Update girls.json
        const girlsStats = updateClassifications(GIRLS_JSON, 'Girl', popularNameMap, unpopularNameMap);

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total names processed: ${boysStats.total + girlsStats.total}`);
        console.log(`Total updated: ${boysStats.updated + girlsStats.updated}`);
        console.log(`Total uncategorized: ${boysStats.uncategorized + girlsStats.uncategorized}`);
        console.log('\nUpdate complete!');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { getClassification, buildClassificationMaps };
