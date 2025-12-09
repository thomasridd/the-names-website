# The Names Website

A static website generator for exploring baby name trends and popularity over time.

## Overview

The Names Website is a data-driven static site that generates thousands of individual name pages from JSON data sources. It classifies names by popularity trends and provides a browsable classification system, outputting a fully static website optimized for deployment.

### Features

- **Comprehensive Name Database** - Thousands of boys' and girls' names with historical data
- **Dual Time Periods** - Recent trends (1996-2024) and historic patterns (1904-2024)
- **31 Classification Types** - 15 recent + 16 historic pattern classifications
- **Clean URLs** - Gender-separated structure: `/names/boy/slug/` and `/names/girl/slug/`
- **Responsive Design** - Built with Tailwind CSS v4
- **Static Generation** - Pre-generated pages for fast loading and easy deployment
- **Browse by Classification** - Dedicated pages for each popularity pattern type

### Current Status

✅ **Production Ready** - Full-featured static site with production data, complete classification system, and thousands of generated pages.

## Technology Stack

- **Static Site Generator:** [11ty (Eleventy)](https://www.11ty.dev/) v3.1.2
- **Templates:** Nunjucks
- **Styling:** Tailwind CSS v4.1.17 with PostCSS
- **Data Format:** JSON
- **Data Processing:** Node.js + Python scripts

## Quick Start

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- Python 3 (for data generation scripts)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd the-names-website

# Install dependencies
npm install
```

### Development

```bash
# Start the development server with live reload
npm run dev
```

Visit `http://localhost:8080` to see the site.

### Build

```bash
# Build for production
npm run build
```

Output is generated in the `_site/` directory.

## Project Structure

```
the-names-website/
├── data/                           # Data source files
│   ├── boys.json                   # Boys names (~9.3MB)
│   ├── girls.json                  # Girls names (~9.4MB)
│   ├── classification-descriptions.json
│   └── names.csv                   # Sample data for homepage
├── scripts/                        # Data processing scripts
│   ├── generate_boys_json.py       # Generate boys.json
│   ├── generate_girls_json.py      # Generate girls.json
│   ├── add-recent-classifications.js
│   ├── add-historic-classifications.js
│   └── generate-unique-slugs.js
├── src/                            # Source templates and assets
│   ├── templates/                  # Page templates
│   ├── styles/                     # CSS files
│   ├── scripts/                    # JavaScript files
│   ├── index.njk                   # Homepage
│   ├── names.njk                   # All names listing
│   ├── name-pages.njk              # Individual name pages
│   ├── classifications.njk         # Classifications overview
│   └── classification-pages.njk    # Classification detail pages
├── _site/                          # Generated output (gitignored)
├── .eleventy.js                    # 11ty configuration
├── package.json                    # Dependencies and scripts
└── tailwind.config.js              # Tailwind configuration
```

## Data Structure

Each name in the JSON files contains:

```json
{
  "name": "Muhammad",
  "rank": 1,
  "count": 5721,
  "rankFrom1996": ["108", "95", "89", ...],  // 29 years (1996-2024)
  "rankHistoric": ["x", "x", "46", ...],      // 13 decades (1910s-2020s)
  "recentClassification": "Shooting Star",
  "historicClassification": "Modern Era",
  "uniqueSlug": "muhammad",
  "gender": "Boy"
}
```

## Classification System

Names are classified into 31 distinct pattern types:

### Recent Classifications (1996-2024)

15 pattern types analyzing 29 years of annual data:
- **Timeless** - Maintains high popularity consistently
- **Shooting Star** - Dramatic rise of 300+ positions
- **Comeback** - Returned to prominence after decline
- **Slow Burn** - Gradual rise over 20+ years
- **Fading Glory** - Former top names now declining
- And 10 more...

### Historic Classifications (1904-2024)

16 pattern types analyzing 120+ years of data:
- **Century Classic** - Top 100 in 10+ decades
- **Golden Age** - Dominated for 3-5 consecutive decades
- **Modern Era** - First entered top 100 in 2000s+
- **Pendulum** - Popular early, disappeared, then returned
- **Lost Generation** - Popular in early decades, never returned
- And 11 more...

## Data Processing

### Complete Pipeline

```bash
# Generate initial JSON files
python scripts/generate_boys_json.py
python scripts/generate_girls_json.py

# Add classifications
node scripts/add-recent-classifications.js
node scripts/add-historic-classifications.js

# Generate unique slugs
node scripts/generate-unique-slugs.js

# Build the site
npm run build
```

## Available Scripts

- `npm run dev` - Start development server with live reload
- `npm run build` - Build for production
- `npm run build:eleventy` - Build HTML only
- `npm run build:css` - Build CSS only

## Generated Output

The build process generates:
- **Individual name pages** - One page per name at `/names/{gender}/{slug}/`
- **Classification pages** - One page per classification type
- **All names listing** - Complete alphabetical listing
- **Homepage** - Featured names and overview
- **Compiled CSS** - Optimized Tailwind CSS

## Deployment

The `_site/` directory contains a fully static website that can be deployed to:
- Netlify
- Vercel
- Cloudflare Pages
- GitHub Pages
- Any static hosting service

## Future Enhancements

- [ ] Advanced client-side search (Fuse.js or Pagefind)
- [ ] Search index generation
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Performance optimizations (minification, lazy loading)
- [ ] Analytics integration

## Contributing

This is a personal project by Tom Ridd. If you have suggestions or find issues, please open an issue or pull request.

## License

[Add license information here]

## Contact

Tom Ridd - twridd@gmail.com

## Acknowledgments

- Built with [11ty](https://www.11ty.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Name data sourced from [data source - add if applicable]
