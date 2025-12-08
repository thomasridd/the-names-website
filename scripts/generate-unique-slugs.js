const fs = require('fs');
const path = require('path');

// Slugify function matching 11ty's default
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateUniqueSlugs(names, gender) {
  // First pass: count how many times each slug appears
  const slugCounts = {};
  names.forEach(name => {
    const modifiedName = name.name.endsWith('-') ? name.name + 'dash' : name.name
    const slug = slugify(modifiedName);
    slugCounts[slug] = (slugCounts[slug] || 0) + 1;
  });

  // Second pass: assign unique slugs
  const slugCounters = {};
  const results = names.map(name => {
    const modifiedName = name.name.endsWith('-') ? name.name + 'dash' : name.name
    const baseSlug = slugify(modifiedName);

    // If this slug only appears once, use it as-is
    if (slugCounts[baseSlug] === 1) {
      return {
        ...name,
        uniqueSlug: baseSlug
      };
    }

    // If there are conflicts, number them
    if (!slugCounters[baseSlug]) {
      slugCounters[baseSlug] = 1;
    }
    const counter = slugCounters[baseSlug];
    slugCounters[baseSlug]++;

    return {
      ...name,
      uniqueSlug: `${baseSlug}-${counter}`
    };
  });

  // Report statistics
  const totalConflicts = Object.values(slugCounts).filter(count => count > 1).length;
  const totalAffected = Object.values(slugCounts).reduce((sum, count) => sum + (count > 1 ? count : 0), 0);

  console.log(`${gender}:`);
  console.log(`  Total names: ${names.length}`);
  console.log(`  Unique slugs: ${names.length - totalAffected + totalConflicts}`);
  console.log(`  Conflicting slugs: ${totalConflicts}`);
  console.log(`  Names affected: ${totalAffected}`);

  // Show examples of conflicts
  const conflicts = Object.entries(slugCounts)
    .filter(([slug, count]) => count > 1)
    .slice(0, 5);

  if (conflicts.length > 0) {
    console.log(`  Example conflicts:`);
    conflicts.forEach(([slug, count]) => {
      const examples = names.filter(n => slugify(n.name) === slug).map(n => n.name);
      console.log(`    "${slug}" (${count}): ${examples.join(', ')}`);
    });
  }
  console.log();

  return results;
}

// Load data
const boysPath = path.join(__dirname, '../data/boys.json');
const girlsPath = path.join(__dirname, '../data/girls.json');

console.log('Loading data...\n');

const boysData = JSON.parse(fs.readFileSync(boysPath, 'utf-8'));
const girlsData = JSON.parse(fs.readFileSync(girlsPath, 'utf-8'));

console.log('Generating unique slugs...\n');

const boysWithSlugs = generateUniqueSlugs(boysData, 'Boys');
const girlsWithSlugs = generateUniqueSlugs(girlsData, 'Girls');

// Write back to files
console.log('Writing updated files...\n');

fs.writeFileSync(boysPath, JSON.stringify(boysWithSlugs, null, 2));
console.log(`✓ Updated ${boysPath}`);

fs.writeFileSync(girlsPath, JSON.stringify(girlsWithSlugs, null, 2));
console.log(`✓ Updated ${girlsPath}`);

console.log('\nDone! Each name now has a uniqueSlug field.');
