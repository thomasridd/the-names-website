# CLAUDE.md - AI Assistant Guide for the-names-website

**Last Updated:** December 8, 2025
**Project:** the-names-website
**Description:** A website for thinking about names
**Owner:** thomasridd

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Current Project State](#current-project-state)
3. [Repository Structure](#repository-structure)
4. [Data Sources](#data-sources)
5. [Classification System](#classification-system)
6. [Development Workflows](#development-workflows)
7. [Key Conventions](#key-conventions)
8. [Technology Stack](#technology-stack)
9. [Common Tasks](#common-tasks)
10. [Git Workflow](#git-workflow)
11. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Overview

### Purpose
The-names-website is a **static website generator** for exploring baby name trends and popularity over time. It:
- Generates thousands of individual name pages from JSON data sources
- Classifies names by popularity trends (recent and historic patterns)
- Provides a browsable classification system
- Outputs a fully static website optimized for deployment

### Project Type
**Static Site Generator (SSG)** - Data-driven static website with:
- ✅ JSON-based page generation (one page per name)
- ✅ Template-based rendering with Nunjucks
- ✅ Classification system (31 unique pattern types)
- ✅ Clean URL structure with unique slugs
- ✅ Thousands of generated pages

### Current Status
✅ **PRODUCTION READY** - Full-featured static site with:
- Production name data (thousands of boys' and girls' names)
- Complete classification system (15 recent + 16 historic patterns)
- Clean URL structure with unique slug handling
- Responsive Tailwind CSS design
- Multiple page types (homepage, listings, individual pages)
- Working build system generating thousands of static pages

### Repository Information
- **Repository:** thomasridd/the-names-website
- **Git Remote:** Local Git proxy
- **Primary Contact:** Tom Ridd (twridd@gmail.com)
- **Initial Commit:** December 7, 2025

---

## Current Project State

### What Exists

#### Core Infrastructure
- ✅ Git repository initialized with remote connection
- ✅ 11ty static site generator configured (.eleventy.js)
- ✅ Tailwind CSS v4 integrated with PostCSS build pipeline
- ✅ npm scripts for development and production builds
- ✅ .gitignore file configured

#### Data
- ✅ Production JSON data files (data/boys.json, data/girls.json) - ~18.7MB total
- ✅ Classification descriptions (data/classification-descriptions.json)
- ✅ Sample CSV data (data/names.csv) - used for homepage features
- ✅ Each name includes:
  - Basic info: name, rank, count, gender
  - 29 years of recent rankings (1996-2024)
  - 13 decades of historic rankings (1904-2024)
  - Recent and historic classifications
  - Unique slug for clean URLs

#### Templates & Pages
- ✅ Base layout template (src/templates/base.njk)
- ✅ Homepage (src/index.njk)
- ✅ All names listing (src/names.njk)
- ✅ Individual name pages (src/name-pages.njk) - thousands generated
- ✅ Classifications overview (src/classifications.njk)
- ✅ Individual classification pages (src/classification-pages.njk)
- ✅ Responsive design with Tailwind utility classes

#### Scripts
- ✅ Python data generators (scripts/generate_boys_json.py, scripts/generate_girls_json.py)
- ✅ Classification processors (scripts/add-recent-classifications.js, scripts/add-historic-classifications.js)
- ✅ Unique slug generator (scripts/generate-unique-slugs.js)

#### Features
- ✅ Clean URL structure: `/names/boy/unique-slug/` and `/names/girl/unique-slug/`
- ✅ Gender-separated name organization
- ✅ Popularity trend visualization (grid display of rankings)
- ✅ Classification badges on name pages
- ✅ Browse by classification pages
- ✅ Basic search placeholder (ready for enhancement)

### What Doesn't Exist Yet
- ❌ Advanced search (Fuse.js, Lunr.js, or Pagefind)
- ❌ Search index generation
- ❌ CI/CD pipelines
- ❌ Deployment configuration
- ❌ Performance optimizations (minification, lazy loading)

### Next Steps for Development
1. **Enhance Search** - Integrate Fuse.js or Pagefind for client-side search
2. **Generate Search Index** - Build JSON index during compilation
3. **Set Up CI/CD** - GitHub Actions for automated builds
4. **Configure Deployment** - Deploy to Netlify, Vercel, or Cloudflare Pages
5. **Optimize Performance** - Minify CSS/JS, optimize build time
6. **Add Analytics** - Track popular names and classifications

---

## Repository Structure

### Current Structure

```
the-names-website/
├── .git/                           # Git version control
├── .claude/                        # Claude Code configuration
│   └── settings.local.json
├── data/                           # Data source files
│   ├── boys.json                   # Boys names (~9.3MB, thousands of entries)
│   ├── girls.json                  # Girls names (~9.4MB, thousands of entries)
│   ├── classification-descriptions.json  # Descriptions for all classifications
│   └── names.csv                   # Sample data for homepage
├── scripts/                        # Data processing scripts
│   ├── generate_boys_json.py       # Python script to generate boys.json
│   ├── generate_girls_json.py      # Python script to generate girls.json
│   ├── add-recent-classifications.js    # Add recent (1996-2024) classifications
│   ├── add-historic-classifications.js  # Add historic (1904-2024) classifications
│   └── generate-unique-slugs.js    # Generate unique slugs for duplicate names
├── src/                            # Source templates and assets
│   ├── templates/                  # Page templates
│   │   └── base.njk                # Base layout template
│   ├── styles/                     # CSS/styling files
│   │   └── main.css                # Tailwind CSS entry point
│   ├── scripts/                    # JavaScript files
│   │   └── search.js               # Client-side search (placeholder)
│   ├── index.njk                   # Homepage template
│   ├── names.njk                   # All names listing template
│   ├── name-pages.njk              # Individual name page template (pagination)
│   ├── classifications.njk         # Classifications overview page
│   └── classification-pages.njk    # Individual classification page template
├── _site/                          # Generated static output (gitignored)
│   ├── index.html
│   ├── names/
│   │   ├── boy/                    # Boys name pages
│   │   │   ├── muhammad/
│   │   │   ├── noah/
│   │   │   └── ... (thousands more)
│   │   ├── girl/                   # Girls name pages
│   │   │   ├── olivia/
│   │   │   ├── amelia/
│   │   │   └── ... (thousands more)
│   │   └── index.html
│   ├── classifications/
│   │   ├── recent/                 # Recent classification pages
│   │   │   ├── timeless/
│   │   │   ├── shooting-star/
│   │   │   └── ...
│   │   ├── historic/               # Historic classification pages
│   │   │   ├── century-classic/
│   │   │   ├── golden-age/
│   │   │   └── ...
│   │   └── index.html
│   ├── styles/
│   │   └── main.css                # Compiled Tailwind CSS
│   └── scripts/
│       └── search.js
├── .gitignore                      # Git ignore rules
├── .eleventy.js                    # 11ty configuration
├── package.json                    # Node.js dependencies and scripts
├── package-lock.json
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── README.md                       # Project documentation
└── CLAUDE.md                       # This file - AI assistant guide
```

---

## Data Sources

### JSON Data Files

The primary data source is **JSON files** containing comprehensive name information:

**Files:**
- `data/boys.json` - ~9.3MB, thousands of boys' names
- `data/girls.json` - ~9.4MB, thousands of girls' names

**Data Structure:**
Each name object contains:
```json
{
  "name": "Muhammad",
  "rank": 1,
  "count": 5721,
  "rankFrom1996": ["108", "95", "89", ...],  // 29 values (1996-2024)
  "rankHistoric": ["x", "x", "46", ...],      // 13 values (1910s-2020s by decade)
  "recentClassification": "Shooting Star",
  "historicClassification": "Modern Era",
  "uniqueSlug": "muhammad",
  "gender": "Boy"  // Added during processing
}
```

**Rank Data:**
- `rankFrom1996`: Array of 29 values (1996-2024), one per year
- `rankHistoric`: Array of 13 values (1910s-2020s), one per decade
- Values: Numeric rank (1-999+) or "x" (unranked)

**Classifications:**
- `recentClassification`: One of 15 pattern types (1996-2024)
- `historicClassification`: One of 16 pattern types (1904-2024)

**URL Structure:**
- Gender-separated: `/names/boy/unique-slug/` or `/names/girl/unique-slug/`
- `uniqueSlug` handles duplicate names across genders (e.g., "jordan-1", "jordan-2")

### Classification Descriptions

**File:** `data/classification-descriptions.json`

Contains human-readable descriptions for each classification type:
```json
{
  "recent": {
    "Timeless": "Maintains high popularity...",
    "Shooting Star": "Dramatic rise of 300+ positions...",
    ...
  },
  "historic": {
    "Century Classic": "Appears in top 100 in 10+ decades...",
    "Golden Age": "Dominated (top 20) for 3-5 consecutive decades...",
    ...
  }
}
```

### Sample CSV Data

**File:** `data/names.csv`

Small sample dataset used for homepage featured names. Kept for compatibility but main data is in JSON files.

### Data Generation Process

1. **Python Scripts** (scripts/generate_*_json.py) - Generate initial JSON files from source data
2. **Classification Scripts** (scripts/add-*-classifications.js) - Add classification properties
3. **Slug Generator** (scripts/generate-unique-slugs.js) - Add unique slugs for URL generation

**Important:** Data files are large (~18.7MB total) but version controlled for reproducibility.

---

## Classification System

### Overview

Names are classified into 31 distinct pattern types based on popularity trends over time:
- **15 Recent Classifications** - Based on 29 years (1996-2024)
- **16 Historic Classifications** - Based on 120+ years (1904-2024)

### Recent Classifications (1996-2024)

Analyze 29 years of annual ranking data to identify modern trends:

1. **Timeless** - Maintains high popularity (top 100) consistently with minimal variation (±20 positions)
2. **Steady Classic** - Remains in top 200 throughout, never dropping below top 300
3. **Comeback** - Dropped significantly (fell out of top 500) mid-period, returned to top 200 recently
4. **Shooting Star** - Dramatic rise of 300+ positions over past 5-7 years, currently in top 200
5. **Slow Burn** - Gradual, consistent upward trajectory over 20+ years, gaining 200+ positions
6. **Fading Glory** - Was top 100 for 10+ years, now ranked 500+ or unranked
7. **Flash Trend** - Sudden spike to popularity (top 100) for 3-5 years, then declined rapidly
8. **Cultural Moment** - Sharp popularity spike correlating with specific cultural events, followed by decline
9. **Generational** - Peaked in specific decade, clearly associated with one generation
10. **Sleeper** - Remained in 200-500 range consistently for 25+ years, never breaking through
11. **Volatile** - Multiple significant swings (150+ position changes) with no clear pattern
12. **New Entrant** - First appeared in rankings within past 10 years, currently gaining momentum
13. **Vintage Revival** - Was unranked for 15+ years, recently re-entered top 500
14. **Declining Classic** - Started in top 50, experiencing steady decline but still ranked in top 300
15. **Uncategorized** - Does not fit clearly into any defined classification pattern

### Historic Classifications (1904-2024)

Analyze 13 decades of top 100 data to identify long-term patterns:

1. **Century Classic** - Appears in top 100 in 10+ decades, never absent for more than one consecutive decade
2. **Golden Age** - Dominated (top 20) for 3-5 consecutive decades, then faded from top 100
3. **Early Century** - Top 100 from 1910s-1950s, largely disappeared by 1970s onwards
4. **Mid-Century** - Peak popularity 1940s-1970s, minimal presence before or after
5. **Late Century** - Emerged in top 100 during 1970s-1990s, maintaining or growing since
6. **Modern Era** - First entered top 100 in 2000s or later
7. **Pendulum** - Popular early (1910s-1930s), disappeared mid-century, returned in 2000s+
8. **Lost Generation** - Top 100 in early decades (pre-1950s), hasn't returned since
9. **Steady Decline** - Started in top 100 in 1910s, gradually declining each decade
10. **Steady Rise** - Started outside/barely in top 100 early, consistently climbing, now firmly established
11. **Peak and Fade** - Reached top 10 in at least one decade, then dropped out of top 100 within 3-4 decades
12. **Brief Moment** - Appeared in top 100 for only 1-3 non-consecutive decades
13. **Resilient** - Consistently appears in top 100 across 7-9 decades but never reaches top 20
14. **Intermittent** - Appears in top 100 for 4-6 decades with significant gaps (2+ consecutive decades missing)
15. **Revolutionary** - Sharp entry into top 100 coinciding with major cultural shifts (1960s, 1990s)
16. **Uncategorized** - Does not fit clearly into any defined classification pattern

### Classification Processing

**Scripts:**
- `scripts/add-recent-classifications.js` - Implements logic for 15 recent patterns
- `scripts/add-historic-classifications.js` - Implements logic for 16 historic patterns

**Usage:**
```bash
# Add recent classifications
node scripts/add-recent-classifications.js

# Add historic classifications
node scripts/add-historic-classifications.js
```

Both scripts:
- Read boys.json and girls.json
- Apply classification algorithms
- Add `recentClassification` or `historicClassification` properties
- Write updated JSON back to files
- Print statistics about classification distribution

### Classification Pages

Each classification gets its own page at:
- `/classifications/recent/{slug}/` - Recent classification pages
- `/classifications/historic/{slug}/` - Historic classification pages

Pages display:
- Classification name and description
- Time period covered
- All names matching that pattern (separated by gender)
- Count of matching names

---

## Development Workflows

### Feature Development Workflow

When implementing new features:

1. **Understand Requirements**
   - Read the user's request carefully
   - Ask clarifying questions if needed
   - Identify affected files and components

2. **Plan Implementation**
   - Use TodoWrite tool to create task list
   - Break down complex features into steps
   - Identify dependencies

3. **Read Before Writing**
   - Always read existing files before modifying
   - Understand current patterns and conventions
   - Maintain consistency with existing code

4. **Implement Changes**
   - Follow established patterns
   - Write clear, maintainable code
   - Add comments only where logic isn't self-evident
   - Avoid over-engineering

5. **Test Changes**
   - Run the development server (`npm run dev`)
   - Test new functionality manually
   - Check generated output in `_site/` directory
   - Fix any issues found

6. **Commit and Push**
   - Write clear commit messages
   - Follow git workflow (see below)
   - Push to feature branch

### Data Processing Workflow

When updating or regenerating data:

1. **Generate Base JSON** (if needed)
   ```bash
   python scripts/generate_boys_json.py
   python scripts/generate_girls_json.py
   ```

2. **Add Classifications**
   ```bash
   node scripts/add-recent-classifications.js
   node scripts/add-historic-classifications.js
   ```

3. **Generate Unique Slugs**
   ```bash
   node scripts/generate-unique-slugs.js
   ```

4. **Build Site**
   ```bash
   npm run build
   ```

5. **Verify Output**
   - Check `_site/` directory for generated pages
   - Test navigation and links
   - Verify classification pages

---

## Key Conventions

### Code Style Conventions

#### General Principles
- **Simplicity Over Complexity** - Don't over-engineer solutions
- **Consistency** - Follow established patterns in the codebase
- **Clarity** - Write self-documenting code with clear naming
- **Minimal Comments** - Only comment non-obvious logic

#### File Naming
- Use kebab-case for files: `name-pages.njk`, `add-recent-classifications.js`
- Template files use `.njk` extension (Nunjucks)
- Scripts use `.js` extension (Node.js) or `.py` (Python)

#### Code Organization
- One template per file
- Group related functionality together
- Keep files focused and single-purpose
- Scripts in `scripts/` directory
- Templates in `src/` or `src/templates/`

#### Template Guidelines
- Keep templates focused and single-purpose
- Use Nunjucks template syntax
- Use meaningful variable names in templates
- Separate layout templates from content templates
- Keep template logic simple (complex logic in .eleventy.js or scripts)

#### Data Processing
- Handle JSON parsing during build time (in .eleventy.js)
- Classification logic in dedicated scripts
- Use Node.js for JavaScript scripts
- Use Python for data generation scripts
- Always preserve data structure when adding properties

#### Error Handling
- Only validate at system boundaries (data input, file reading)
- Trust internal code and framework guarantees
- Handle missing/malformed data gracefully
- Provide clear error messages during build

### Security Conventions
- Never commit secrets, API keys, or credentials
- Validate data structure during processing
- Be aware of XSS risks in template rendering
- Sanitize any user-generated content (if added in future)

### Documentation Conventions
- Keep README.md up-to-date with setup instructions
- Document classification logic in script comments
- Update this CLAUDE.md as the project evolves
- Don't create unnecessary documentation files

---

## Technology Stack

### Status: ✅ PRODUCTION STACK CONFIGURED

**Current Stack:**
- **SSG:** 11ty (Eleventy) v3.1.2
- **Templates:** Nunjucks
- **Data Format:** JSON (migrated from CSV)
- **Styling:** Tailwind CSS v4.1.17 with PostCSS
- **CSS Processing:** @tailwindcss/postcss + autoprefixer
- **Build Tools:** npm-run-all for parallel builds
- **Data Processing:** Node.js + Python scripts
- **Search:** Basic JavaScript placeholder (ready for Fuse.js/Pagefind)

### Key Dependencies

**DevDependencies:**
```json
{
  "@11ty/eleventy": "^3.1.2",
  "@tailwindcss/postcss": "^4.1.17",
  "autoprefixer": "^10.4.22",
  "csv-parse": "^6.1.0",
  "npm-run-all": "^4.1.5",
  "postcss": "^8.5.6",
  "postcss-cli": "^11.0.1",
  "tailwindcss": "^4.1.17"
}
```

### Why This Stack?

**11ty (Eleventy):**
- Excellent for data-driven sites with thousands of pages
- Flexible data sources (JSON, CSV, YAML)
- Multiple template language support
- Fast builds even with large datasets
- Simple configuration

**Nunjucks Templates:**
- Powerful templating with filters and macros
- Similar to Jinja2/Django templates
- Good documentation and community support
- Easy to learn and maintain

**Tailwind CSS v4:**
- Utility-first CSS for rapid development
- Responsive design made easy
- Minimal CSS output (only used utilities)
- PostCSS integration for processing

**JSON Data Format:**
- Easier to work with in JavaScript than CSV
- Preserves data types and structure
- Supports nested arrays (rankings)
- Efficient parsing in 11ty

---

## Common Tasks

### Starting Development Server

```bash
npm run dev
```

This command:
1. Builds CSS once with Tailwind/PostCSS
2. Starts 11ty dev server with live reload
3. Watches CSS files for changes
4. Runs both in parallel with npm-run-all

### Building for Production

```bash
npm run build
```

This command:
1. Runs `npm run build:eleventy` - Generates all HTML pages from templates and data
2. Runs `npm run build:css` - Processes CSS with Tailwind/PostCSS

**Output:** `_site/` directory with thousands of HTML files + compiled CSS

### Processing Data

**Generate initial JSON files:**
```bash
python scripts/generate_boys_json.py
python scripts/generate_girls_json.py
```

**Add recent classifications (1996-2024):**
```bash
node scripts/add-recent-classifications.js
```

**Add historic classifications (1904-2024):**
```bash
node scripts/add-historic-classifications.js
```

**Generate unique slugs:**
```bash
node scripts/generate-unique-slugs.js
```

**Complete data processing pipeline:**
```bash
# Run all processing steps in sequence
python scripts/generate_boys_json.py && \
python scripts/generate_girls_json.py && \
node scripts/add-recent-classifications.js && \
node scripts/add-historic-classifications.js && \
node scripts/generate-unique-slugs.js
```

### Previewing Production Build

```bash
# Install serve if needed
npm install -g serve

# Serve the _site directory
npx serve _site
```

Then visit http://localhost:3000

### Installing Dependencies

```bash
npm install <package-name>
```

### Validating Build

```bash
# Build the site
npm run build

# Check for errors in output
# Verify key pages exist
ls _site/
ls _site/names/boy/
ls _site/names/girl/
ls _site/classifications/recent/
ls _site/classifications/historic/
```

---

## Git Workflow

### Branch Strategy

**Feature Branches** - All development happens on feature branches:
- Branch naming: `claude/claude-md-<session-id>` or `claude/<feature-name>-<session-id>`
- Never push directly to main/master
- Create pull requests for code review

### Making Commits

**When to Commit:**
- Only create commits when explicitly requested by the user
- Commit logically related changes together
- Don't commit secrets or sensitive data

**Commit Message Format:**
```
<type>: <concise description>

<optional detailed explanation>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `style:` - Code style/formatting changes
- `data:` - Data updates or processing changes
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add classification list pages"
git commit -m "data: add historic classifications to name datasets"
git commit -m "docs: update CLAUDE.md with current project state"
```

### Pushing Changes

Always push to the designated feature branch:

```bash
git push -u origin <branch-name>
```

**Retry Logic:**
- If push fails due to network errors, retry up to 4 times
- Use exponential backoff: 2s, 4s, 8s, 16s
- For other errors, investigate before retrying

### Pull Requests

When creating a pull request:

1. Ensure all changes are committed and pushed
2. Use `gh pr create` with descriptive title and body
3. Include summary of changes (2-3 bullet points)
4. Add test plan/checklist
5. Reference any related issues

**Example:**
```bash
gh pr create --title "Add classification system for name trends" --body "$(cat <<'EOF'
## Summary
- Implemented 31 classification types (15 recent + 16 historic)
- Added classification processing scripts
- Created classification listing and detail pages

## Test plan
- [ ] Build completes successfully
- [ ] All classification pages generate correctly
- [ ] Name pages display classification badges
- [ ] Classification links work properly
EOF
)"
```

---

## AI Assistant Guidelines

### General Principles

1. **Read Before Writing**
   - Always read files before modifying them
   - Understand existing patterns before making changes
   - Never propose changes to code you haven't read

2. **Use TodoWrite Tool**
   - Create task lists for multi-step operations
   - Track progress and mark items complete
   - One task in_progress at a time

3. **Ask When Uncertain**
   - If requirements are unclear, ask the user
   - Don't make assumptions about data structure
   - Clarify before making major changes

4. **Keep It Simple**
   - Don't over-engineer solutions
   - Only make requested changes
   - Avoid unnecessary abstractions
   - Three similar lines > premature abstraction

5. **Be Consistent**
   - Follow established patterns in the codebase
   - Match existing code style
   - Use consistent naming conventions

6. **Security First**
   - Never commit secrets or credentials
   - Validate data structure during processing
   - Fix security issues immediately

7. **Test Your Changes**
   - Run the dev server after changes
   - Verify functionality works
   - Check generated output in _site/
   - Fix any errors before committing

### Project-Specific Guidelines

#### Working with Large Data Files
- **boys.json and girls.json are ~18.7MB total** - Be mindful when reading
- Use offset/limit parameters when reading large files
- Don't try to read entire files in one operation
- Use Grep for searching within large JSON files
- Data files are version controlled despite size

#### Working with Classifications
- **31 classification types total** - 15 recent + 16 historic
- Classifications are added by separate scripts, not during build
- Classification logic is complex - read the scripts before modifying
- Each classification has a description in classification-descriptions.json
- Uncategorized is a valid classification for names that don't fit patterns

#### Static Site Generator Specific
- **Data Processing** - Handle JSON parsing during build in .eleventy.js
- **Template Reuse** - Base template in src/templates/base.njk
- **Build Performance** - Build generates thousands of pages, can take time
- **Pagination** - Name pages use 11ty pagination (size: 1)
- **Static Output** - All pages are pre-generated, no server-side logic
- **URL Structure** - Clean URLs with gender separation: `/names/boy/slug/` or `/names/girl/slug/`

#### URL and Slug Handling
- **Unique slugs** - Names can be duplicated across genders (e.g., Jordan)
- Gender-separated URLs prevent conflicts
- Slugs are generated by scripts/generate-unique-slugs.js
- Never manually create slugs - use the script
- Permalinks in templates use `{{ nameData.uniqueSlug }}`

#### When Reading Code
- Use Read tool for specific files
- **For large data files** - Use Grep or read with offset/limit
- Use Task tool with Explore agent for broader exploration
- Read in parallel when files are independent
- Understand context before suggesting changes

#### When Writing Code
- Use Edit tool for existing files
- Use Write tool only for new files
- Preserve exact indentation
- Match existing code style
- Follow Nunjucks template syntax

#### When Using Tools
- Glob for finding files by pattern
- Grep for searching code content (especially in large JSON files)
- Bash for terminal operations only (not file operations)
- Task tool for complex multi-step operations

### Communication Style
- Be concise and direct
- No emojis unless requested
- Focus on technical accuracy
- Output text for communication, not bash echo

### Error Handling
- If you encounter errors, fix them immediately
- Don't ignore warnings that indicate problems
- Report issues clearly to the user
- Suggest solutions when problems occur

### Before Completing Tasks
- ✅ All requested changes implemented
- ✅ Code follows project conventions
- ✅ No security vulnerabilities introduced
- ✅ Build completes successfully
- ✅ Generated pages look correct in _site/ output
- ✅ Links and navigation work properly
- ✅ Data structure preserved
- ✅ Changes committed with clear message
- ✅ Pushed to correct branch

---

## Maintenance

### Updating This Document

This CLAUDE.md should be updated when:
- New features are added
- Data structure changes
- Build processes change
- New scripts are added
- Classification system is modified
- New page types are created

### Version History

- **v2.0** - December 8, 2025 - Complete refresh: production data, classification system, unique slugs, thousands of pages
- **v1.3** - December 7, 2025 - Integrated Tailwind CSS v4 with PostCSS build pipeline
- **v1.2** - December 7, 2025 - Updated with selected technology stack (11ty + Nunjucks + csv-parse)
- **v1.1** - December 7, 2025 - Updated with SSG-specific guidance, CSV data handling, and search functionality
- **v1.0** - December 7, 2025 - Initial creation for early-stage project

---

## Questions?

If you're an AI assistant working on this project and encounter situations not covered in this guide:
1. Review the existing codebase for patterns
2. Consult the user for clarification
3. Check data/classification-descriptions.json for classification details
4. Review scripts/ directory for data processing logic
5. Update this document with new learnings

---

**Remember:** This project now has production data and a complete classification system. Always test changes with the build system to ensure thousands of pages generate correctly. The data files are large - use appropriate tools and techniques when working with them.
