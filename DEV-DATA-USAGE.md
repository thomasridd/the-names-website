# Using Dev Data Files

## Overview

The dev data files contain only the top 500 names from each gender, reducing file size by ~97% for faster development builds.

**File Sizes:**
- Production: `boys.json` (19 MB) + `girls.json` (25 MB) = **44 MB total**
- Dev: `boys-dev.json` (561 KB) + `girls-dev.json` (560 KB) = **1.1 MB total**

**Build Performance:**
- Full data: ~1000+ pages generated
- Dev data: ~500 pages generated (much faster builds)

## Creating Dev Data Files

```bash
npm run dev:data
```

This creates:
- `data/boys-dev.json` (top 500 boys' names)
- `data/girls-dev.json` (top 500 girls' names)

**Note:** These files are gitignored and must be generated locally.

## Using Dev Data

### Option 1: Temporarily Modify .eleventy.js

Edit `.eleventy.js` and change the data loading:

```javascript
// Change from:
eleventyConfig.addGlobalData("boysNames", () => {
  return JSON.parse(fs.readFileSync("./data/boys.json", "utf8"));
});

// To:
eleventyConfig.addGlobalData("boysNames", () => {
  const file = process.env.USE_DEV_DATA ? "./data/boys-dev.json" : "./data/boys.json";
  return JSON.parse(fs.readFileSync(file, "utf8"));
});
```

Then run:
```bash
USE_DEV_DATA=1 npm run dev
```

### Option 2: Create a Dev Config (Recommended)

Create `.eleventy.dev.js`:

```javascript
// Copy .eleventy.js and modify the data paths
module.exports = function(eleventyConfig) {
  // ... copy config but use boys-dev.json and girls-dev.json
};
```

Then run:
```bash
eleventy --config=.eleventy.dev.js --serve
```

### Option 3: Environment Variable in package.json

Add to `package.json`:

```json
{
  "scripts": {
    "dev:fast": "USE_DEV_DATA=1 npm run dev"
  }
}
```

## When to Use Dev Data

**Use dev data when:**
- Developing templates and styles
- Testing site functionality
- Working on search features
- Rapid iteration needed

**Use full data when:**
- Testing classification logic
- Verifying all names display correctly
- Building for production
- Testing performance with real data

## Regenerating Dev Data

If the full data files are updated (new classifications, new data), regenerate dev files:

```bash
npm run dev:data
```

## Customizing

To change the number of names in dev data, edit `scripts/create-dev-data.js`:

```javascript
const TOP_N = 500; // Change this value
```
