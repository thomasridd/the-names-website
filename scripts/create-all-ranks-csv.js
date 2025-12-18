const fs = require('fs');
const path = require('path');

// Read the JSON files
const boysData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/boys.json'), 'utf8'));
const girlsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/girls.json'), 'utf8'));

// Combine all names
const allNames = [...boysData, ...girlsData];

// Generate decade columns from 1904 to 1994 (10 decades)
const decadeColumns = [];
for (let year = 1904; year <= 1994; year += 10) {
  decadeColumns.push(year.toString());
}

// Generate yearly columns from 1996 to 2024 (29 years)
const yearlyColumns = [];
for (let year = 1996; year <= 2024; year++) {
  yearlyColumns.push(year.toString());
}

// Create header row
const headers = ['name', ...decadeColumns, ...yearlyColumns];
const csvRows = [headers.join(',')];

// Process each name
allNames.forEach(nameData => {
  const row = [nameData.name];

  // Add decade data from rankHistoric (first 10 values: 1904-1994)
  for (let i = 0; i < 10; i++) {
    row.push(nameData.rankHistoric[i] || 'x');
  }

  // Add yearly data from rankFrom1996 (all 29 values: 1996-2024)
  for (let i = 0; i < 29; i++) {
    row.push(nameData.rankFrom1996[i] || 'x');
  }

  csvRows.push(row.join(','));
});

// Write to CSV file
const csvContent = csvRows.join('\n');
fs.writeFileSync(path.join(__dirname, '../all_ranks.csv'), csvContent, 'utf8');

console.log(`Created all_ranks.csv with ${allNames.length} names`);
console.log(`Columns: ${headers.length} (name + ${decadeColumns.length} decades + ${yearlyColumns.length} years)`);
