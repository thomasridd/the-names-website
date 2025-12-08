# CLAUDE.md - AI Assistant Guide for the-names-website

**Last Updated:** December 7, 2025
**Project:** the-names-website
**Description:** A website for thinking about names
**Owner:** thomasridd

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Current Project State](#current-project-state)
3. [Repository Structure](#repository-structure)
4. [Data Sources](#data-sources)
5. [Development Workflows](#development-workflows)
6. [Key Conventions](#key-conventions)
7. [Technology Stack](#technology-stack)
8. [Common Tasks](#common-tasks)
9. [Git Workflow](#git-workflow)
10. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Overview

### Purpose
The-names-website is a **static website generator** for exploring and working with names. It will:
- Compile content from configuration files (YAML, Markdown)
- Generate templated pages from CSV data sources (thousands of individual name pages)
- Provide client-side JavaScript search functionality
- Output a fully static website optimized for deployment

### Project Type
**Static Site Generator (SSG)** - Data-driven static website with:
- ✅ YAML/Markdown configuration
- ✅ CSV-based page generation (one page per name)
- ✅ Template-based rendering
- ✅ JavaScript search functionality
- ✅ Thousands of generated pages

### Current Status
✅ **INITIAL SETUP COMPLETE** - 11ty static site generator configured with:
- CSV data processing (10 sample names)
- Template-based page generation
- Basic styling and search placeholder
- Working build system

### Repository Information
- **Repository:** thomasridd/the-names-website
- **Git Remote:** Local Git proxy at http://127.0.0.1:64979/git/thomasridd/the-names-website
- **Primary Contact:** Tom Ridd (twridd@gmail.com)
- **Initial Commit:** December 7, 2025

---

## Current Project State

### What Exists
- ✅ Git repository initialized
- ✅ README.md with basic project description
- ✅ Remote repository connection configured

### What Now Exists
- ✅ Package manager configured (package.json with npm scripts)
- ✅ 11ty static site generator configured (.eleventy.js)
- ✅ Tailwind CSS v4 integrated with PostCSS build pipeline
- ✅ Project directory structure (data/, src/templates/, src/styles/, src/scripts/)
- ✅ Sample CSV data (10 names in data/names.csv)
- ✅ Site configuration (data/config.yaml)
- ✅ Nunjucks templates with Tailwind utility classes (base layout, name pages, homepage, names listing)
- ✅ Tailwind CSS configuration (tailwind.config.js, postcss.config.js)
- ✅ Responsive design with utility-first styling
- ✅ Basic search JavaScript (src/scripts/search.js)
- ✅ Working build system (generates 12 static HTML pages + compiled CSS)
- ✅ .gitignore file

### What Doesn't Exist Yet
- ❌ Production CSV data (thousands of names)
- ❌ Advanced search (Fuse.js, Lunr.js, or Pagefind)
- ❌ Search index generation
- ❌ CI/CD pipelines
- ❌ Deployment configuration

### Next Steps for Development
1. **Add Production Data** - Replace sample CSV with full names dataset
2. **Enhance Search** - Integrate Fuse.js or Lunr.js for better search
3. **Generate Search Index** - Build JSON index during compilation
4. **Improve Styling** - Enhance CSS or add Tailwind CSS
5. **Add Features** - Filters, sorting, categories, related names
6. **Set Up CI/CD** - GitHub Actions for automated builds
7. **Configure Deployment** - Deploy to Netlify, Vercel, or GitHub Pages
8. **Optimize Performance** - Minify CSS/JS, optimize images

---

## Repository Structure

### Recommended Future Structure

Once development begins, consider this structure for a static site generator:

```
the-names-website/
├── .git/                   # Git version control
├── .github/                # GitHub-specific files
│   └── workflows/          # CI/CD workflows (build and deploy)
├── data/                   # Data source files
│   ├── names.csv          # Name data (thousands of rows)
│   ├── config.yaml        # Site configuration
│   └── content/           # Markdown content files
├── src/                    # Source templates and assets
│   ├── templates/         # Page templates
│   │   ├── name.html      # Template for individual name pages
│   │   ├── index.html     # Homepage template
│   │   └── layout.html    # Base layout template
│   ├── styles/            # CSS/styling files
│   │   └── main.css
│   ├── scripts/           # JavaScript files
│   │   └── search.js      # Client-side search functionality
│   └── assets/            # Images, fonts, etc.
├── _site/                  # Generated static output (gitignored)
│   ├── index.html
│   ├── names/
│   │   ├── alice/
│   │   ├── bob/
│   │   └── ... (thousands more)
│   ├── assets/
│   └── search.json        # Search index
├── .gitignore             # Git ignore rules
├── .eleventy.js           # SSG configuration (if using 11ty)
│   # OR
├── astro.config.mjs       # SSG configuration (if using Astro)
│   # OR
├── config.toml            # SSG configuration (if using Hugo)
├── package.json           # Node.js dependencies and scripts
├── README.md              # Project documentation
└── CLAUDE.md              # This file - AI assistant guide
```

### Current Structure

```
the-names-website/
├── .git/                   # Git version control
├── README.md              # Project documentation
└── CLAUDE.md              # This file
```

---

## Data Sources

### CSV Data Files

The primary data source will be **CSV files** containing name information:

**Expected Format:**
- One row per name (thousands of rows expected)
- Each row generates one static page
- Columns may include: name, origin, meaning, popularity, etc.

**Location:**
- `data/names.csv` or multiple CSV files in `data/` directory
- Should be version controlled (unless files are too large)
- Consider using `.gitattributes` for proper line ending handling

**Processing:**
- CSV data will be read during build time
- Each row is passed to a template to generate a page
- URL structure: `/names/[name-slug]/index.html`

### YAML Configuration

**Site Configuration:**
- `data/config.yaml` - Global site settings
- Site title, description, navigation, etc.
- Build options and output settings

**Content Configuration:**
- YAML front matter in Markdown files
- Page-specific metadata and configuration

### Markdown Content

**Static Pages:**
- `data/content/*.md` - Static content pages
- Homepage content, about pages, etc.
- Supports YAML front matter for metadata

### Search Index

**Generated at Build Time:**
- Create searchable JSON index from CSV data
- Output to `_site/search.json` or similar
- Format optimized for client-side JavaScript search
- Consider search libraries: Lunr.js, Fuse.js, FlexSearch

### Data Management Guidelines

1. **CSV Structure** - Keep consistent column names and data types
2. **Data Validation** - Validate CSV data during build (check for required fields)
3. **Performance** - For thousands of pages, optimize build performance
4. **Encoding** - Use UTF-8 encoding for international name support
5. **Version Control** - Commit data files unless they're too large (>100MB)
6. **Sample Data** - Consider including a small sample CSV for development

---

## Development Workflows

### Initial Setup Workflow

When setting up the static site generator for the first time:

1. **Consult with User** - Always confirm technology choices before initializing
   - Static Site Generator (11ty, Astro, Hugo, etc.)
   - Template language (Nunjucks, Liquid, JSX, Go templates, etc.)
   - Styling approach (plain CSS, Tailwind, SCSS, etc.)
   - Search implementation (Lunr.js, Fuse.js, FlexSearch, etc.)

2. **Initialize Package Manager**
   ```bash
   npm init -y
   # or
   yarn init -y
   # or
   pnpm init
   ```

3. **Install Static Site Generator and Dependencies**
   - Install chosen SSG (e.g., `npm install --save-dev @11ty/eleventy`)
   - Install CSV parsing library (e.g., `csv-parse`, `papaparse`)
   - Install search library for client-side search
   - Set up development dependencies (linters, formatters)

4. **Create Project Structure**
   - Create `data/` directory for CSV and YAML files
   - Create `src/templates/` for page templates
   - Create `src/styles/` and `src/scripts/` directories
   - Create `_site/` or equivalent output directory (add to .gitignore)

5. **Configure SSG**
   - Set up configuration file (`.eleventy.js`, `astro.config.mjs`, etc.)
   - Configure data file paths and output directory
   - Set up template processing for CSV data
   - Configure pass-through copy for static assets

6. **Create Sample Data**
   - Create sample `names.csv` with a few rows for testing
   - Create `config.yaml` with basic site settings
   - Add sample Markdown content if needed

7. **Create Basic Templates**
   - Create base layout template
   - Create name page template
   - Create homepage template

8. **Verify Setup**
   - Ensure build process runs successfully
   - Verify pages are generated from CSV data
   - Check dev server with live reloading
   - Test output in `_site/` directory

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
   - Run the development server
   - Test new functionality manually
   - Run automated tests if they exist
   - Fix any issues found

6. **Commit and Push**
   - Write clear commit messages
   - Follow git workflow (see below)
   - Push to feature branch

---

## Key Conventions

### Code Style Conventions

**To Be Established** - These conventions should be set when the technology stack is chosen.

#### General Principles
- **Simplicity Over Complexity** - Don't over-engineer solutions
- **Consistency** - Follow established patterns in the codebase
- **Clarity** - Write self-documenting code with clear naming
- **Minimal Comments** - Only comment non-obvious logic

#### File Naming
- Use kebab-case for files: `user-profile.tsx`, `api-service.ts`
- Component files should match component name
- Test files: `component-name.test.ts` or `component-name.spec.ts`

#### Code Organization
- One component per file
- Group related functionality together
- Keep files focused and single-purpose
- Extract shared logic to utilities

#### TypeScript Guidelines (if adopted)
- Use TypeScript for type safety
- Define interfaces for data structures
- Avoid `any` type - use `unknown` if type is truly unknown
- Use type inference where possible

#### Template Guidelines
- Keep templates focused and single-purpose
- Extract reusable template partials/includes
- Use meaningful variable names in templates
- Separate layout templates from content templates
- Keep template logic simple (complex logic in data processing)

#### Error Handling
- Only validate at system boundaries (user input, external APIs)
- Trust internal code and framework guarantees
- Don't add error handling for scenarios that can't happen
- Handle errors gracefully with user-friendly messages

### Security Conventions
- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Validate and sanitize user input
- Be aware of common vulnerabilities:
  - XSS (Cross-Site Scripting)
  - SQL Injection (if using database)
  - CSRF (Cross-Site Request Forgery)
  - Command Injection

### Documentation Conventions
- Keep README.md up-to-date with setup instructions
- Document non-obvious decisions in code comments
- Update this CLAUDE.md as the project evolves
- Don't create unnecessary documentation files

---

## Technology Stack

### Status: ✅ SELECTED AND CONFIGURED

**Chosen Stack:**
- **SSG:** 11ty (Eleventy) v3.1.2
- **Templates:** Nunjucks
- **CSV Parsing:** csv-parse v6.1.0
- **Styling:** Tailwind CSS v4.1.17 with PostCSS
- **CSS Processing:** @tailwindcss/postcss + autoprefixer
- **Build Tools:** npm-run-all for parallel builds
- **Search:** Basic JavaScript (to be enhanced with Fuse.js later)

### Alternative Options Considered

#### Static Site Generator (SSG) Options

**11ty (Eleventy)** - Highly Recommended for this project
- ✅ Excellent for data-driven sites (CSV, JSON, YAML)
- ✅ Multiple template languages (Nunjucks, Liquid, EJS, etc.)
- ✅ Simple and flexible
- ✅ Great performance with thousands of pages
- ✅ Easy to set up CSV → page generation
- ✅ Active community and good documentation
- 📦 `npm install --save-dev @11ty/eleventy`

**Astro** - Modern Alternative
- ✅ Modern, component-based approach
- ✅ Excellent performance (partial hydration)
- ✅ Can use React/Vue/Svelte components if needed
- ✅ Built-in TypeScript support
- ✅ Good for mixing static and interactive content
- ⚠️ Slightly more complex setup than 11ty
- 📦 `npm create astro@latest`

**Hugo** - High Performance Option
- ✅ Extremely fast build times (important for thousands of pages)
- ✅ Go templates (different syntax than JavaScript)
- ✅ Built-in CSV/JSON data handling
- ✅ Single binary, no dependencies
- ⚠️ Go-based (not Node.js) - different ecosystem
- ⚠️ Template syntax learning curve
- 📦 Binary download or `brew install hugo`

**Jekyll** - Ruby-Based Classic
- ✅ Mature and stable
- ✅ GitHub Pages native support
- ✅ Good Markdown and YAML support
- ⚠️ Ruby-based (different ecosystem)
- ⚠️ Slower builds with thousands of pages
- ⚠️ CSV handling requires plugins
- 📦 `gem install jekyll`

#### CSV Parsing Libraries (Node.js)

- **csv-parse** - Fast, streaming CSV parser
- **papaparse** - Popular, works in browser and Node.js
- **node-csv** - Complete CSV toolset

#### Template Languages

Depends on chosen SSG:
- **Nunjucks** (11ty) - Powerful, similar to Jinja2
- **Liquid** (11ty, Jekyll) - Simple, safe templating
- **JSX/TSX** (Astro) - Component-based, familiar to React devs
- **Go Templates** (Hugo) - Powerful but different syntax
- **EJS** (11ty) - Simple JavaScript templating

#### Client-Side Search Libraries

**Lunr.js**
- ✅ Full-text search in the browser
- ✅ Small footprint (~8KB)
- ✅ No external dependencies
- ✅ Works well with static sites

**Fuse.js**
- ✅ Fuzzy search (typo-tolerant)
- ✅ Simple API
- ✅ Good for name searching
- ✅ Lightweight (~12KB)

**FlexSearch**
- ✅ Very fast
- ✅ Memory efficient
- ✅ Advanced search features
- ✅ Good for large datasets

**Pagefind** (by Cloudflare)
- ✅ Specifically designed for static sites
- ✅ Indexes during build
- ✅ Excellent performance
- ✅ UI components included

#### Styling Options

- **Plain CSS** - Simple, no dependencies (recommended for static sites)
- **Tailwind CSS** - Utility-first CSS, rapid development
- **Sass/SCSS** - CSS preprocessor with variables and mixins
- **CSS-in-JS** - Only if using Astro with components

#### Deployment Options

- **GitHub Pages** - Free, easy, good for static sites
- **Netlify** - Free tier, continuous deployment, forms, redirects
- **Vercel** - Free tier, excellent performance
- **Cloudflare Pages** - Free, fast global CDN
- **AWS S3 + CloudFront** - Scalable, pay-as-you-go

### Recommended Stack

For this project's requirements (CSV data, thousands of pages, search):

**Option 1: Simple and Effective (Recommended)**
- **SSG:** 11ty (Eleventy)
- **Templates:** Nunjucks
- **CSV Parsing:** csv-parse or papaparse
- **Search:** Fuse.js or Lunr.js
- **Styling:** Plain CSS or Tailwind
- **Deployment:** Netlify or GitHub Pages

**Option 2: Modern and Fast**
- **SSG:** Astro
- **Templates:** Astro components (JSX-like)
- **CSV Parsing:** papaparse
- **Search:** Pagefind
- **Styling:** Tailwind CSS
- **Deployment:** Vercel or Cloudflare Pages

**Option 3: Maximum Performance**
- **SSG:** Hugo
- **Templates:** Go templates
- **CSV Parsing:** Built-in Hugo data
- **Search:** Lunr.js or custom JavaScript
- **Styling:** Plain CSS
- **Deployment:** Cloudflare Pages

### Technology Decision Process

When an AI assistant is asked to set up the project:

1. **Ask the user** what technologies they prefer
2. If user has no preference, recommend **11ty + Nunjucks + Fuse.js** for:
   - Simplicity and flexibility
   - Excellent CSV data handling
   - Good performance with thousands of pages
   - Easy template syntax
   - Simple search implementation
3. Document the decision in this file
4. Proceed with setup

---

## Common Tasks

### Starting Development Server

**Current Project (11ty + Tailwind):**
```bash
npm run dev
# Builds CSS once, then runs 11ty and CSS watch in parallel
```

**Other SSG Options:**

**Astro:**
```bash
npm run dev
```

**Hugo:**
```bash
hugo server
# or with live reload
hugo server -D
```

### Building for Production

**Current Project (11ty + Tailwind):**
```bash
npm run build
# Builds 11ty HTML pages, then processes CSS with Tailwind/PostCSS
# Output: _site/ directory with 12 HTML files + compiled CSS
```

**Other SSG Options:**

**Astro:**
```bash
npm run build
```

**Hugo:**
```bash
hugo
# Output goes to public/ directory
```

### Previewing Production Build

**11ty:**
```bash
# Serve the _site directory
npx serve _site
```

**Astro:**
```bash
npm run preview
```

**Hugo:**
```bash
# Serve the public/ directory
cd public && python -m http.server 8000
```

### Processing CSV Data

**Example for 11ty (in .eleventy.js):**
```javascript
const fs = require('fs');
const parse = require('csv-parse/sync');

module.exports = function(eleventyConfig) {
  // Read and parse CSV data
  eleventyConfig.addGlobalData('names', () => {
    const csvContent = fs.readFileSync('data/names.csv', 'utf-8');
    return parse.parse(csvContent, { columns: true });
  });
};
```

### Building Search Index

**Example script to generate search.json:**
```javascript
const fs = require('fs');
const parse = require('csv-parse/sync');

const csvContent = fs.readFileSync('data/names.csv', 'utf-8');
const names = parse.parse(csvContent, { columns: true });

const searchIndex = names.map(row => ({
  name: row.name,
  meaning: row.meaning,
  origin: row.origin,
  url: `/names/${row.name.toLowerCase()}/`
}));

fs.writeFileSync('_site/search.json', JSON.stringify(searchIndex));
```

### Installing Dependencies

```bash
npm install <package-name>
# or
yarn add <package-name>
# or
pnpm add <package-name>
```

### Validating Data

**Check CSV for required fields:**
```bash
# Create a validation script
node scripts/validate-csv.js
```

---

## Git Workflow

### Branch Strategy

**Feature Branches** - All development happens on feature branches:
- Branch naming: `claude/claude-md-<session-id>`
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
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add initial project structure with Vite and React"
git commit -m "fix: resolve naming validation edge case"
git commit -m "docs: update README with setup instructions"
```

### Pushing Changes

Always push to the designated feature branch:

```bash
git push -u origin claude/claude-md-<session-id>
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
gh pr create --title "Initial project setup with Vite and React" --body "$(cat <<'EOF'
## Summary
- Set up Vite build system with React and TypeScript
- Created initial project structure with src/ directory
- Configured ESLint and Prettier for code quality

## Test plan
- [ ] Run `npm install` successfully
- [ ] Start dev server with `npm run dev`
- [ ] Build production bundle with `npm run build`
- [ ] Verify application runs in browser
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
   - Don't make assumptions about technology preferences
   - Clarify before making major architectural decisions

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
   - Validate user input at boundaries
   - Be aware of OWASP Top 10 vulnerabilities
   - Fix security issues immediately

7. **Test Your Changes**
   - Run the dev server after changes
   - Verify functionality works
   - Run tests if they exist
   - Fix any errors before committing

### Project-Specific Guidelines

#### Initial Setup Phase (Current)
- **Always consult user** before choosing technologies
- Don't install packages without explicit approval
- Document all technology decisions in this file
- Create minimal viable setup - don't add extras

#### Development Phase (Future)
- Follow established project structure
- Maintain consistency with chosen tech stack
- Don't add features beyond what's requested
- Keep templates small and focused

#### Static Site Generator Specific
- **Data Processing** - Handle CSV parsing during build, not runtime
- **Template Reuse** - Create reusable partials for repeated elements
- **Build Performance** - Be mindful of build time with thousands of pages
- **Search Index** - Generate search index during build process
- **Static Output** - Remember all pages are pre-generated, no server-side logic
- **Asset Optimization** - Minify CSS/JS, optimize images for static deployment
- **URL Structure** - Use clean URLs (e.g., `/names/alice/` not `/names/alice.html`)

#### Working with CSV Data
- **Validation** - Always validate CSV structure before processing
- **Encoding** - Ensure UTF-8 encoding for international names
- **Edge Cases** - Handle names with special characters, commas, quotes
- **Performance** - Use streaming parsers for large CSV files if needed
- **Sample Data** - Test with small sample before processing thousands of rows

#### When Reading Code
- Use Read tool for specific files
- Use Task tool with Explore agent for broader exploration
- Read in parallel when files are independent
- Understand context before suggesting changes

#### When Writing Code
- Use Edit tool for existing files
- Use Write tool only for new files
- Preserve exact indentation
- Match existing code style

#### When Using Tools
- Glob for finding files by pattern
- Grep for searching code content
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
- ✅ Build completes successfully (if SSG configured)
- ✅ Generated pages look correct in _site/ output
- ✅ Search functionality works (if implemented)
- ✅ CSV data processes correctly (if data exists)
- ✅ Tests pass (if tests exist)
- ✅ Changes committed with clear message
- ✅ Pushed to correct branch

---

## Maintenance

### Updating This Document

This CLAUDE.md should be updated when:
- Technology stack is chosen
- Project structure is established
- New conventions are adopted
- Build processes change
- New tools or workflows are added

### Version History

- **v1.3** - December 7, 2025 - Integrated Tailwind CSS v4 with PostCSS build pipeline
- **v1.2** - December 7, 2025 - Updated with selected technology stack (11ty + Nunjucks + csv-parse)
- **v1.1** - December 7, 2025 - Updated with SSG-specific guidance, CSV data handling, and search functionality
- **v1.0** - December 7, 2025 - Initial creation for early-stage project

---

## Questions?

If you're an AI assistant working on this project and encounter situations not covered in this guide:
1. Review the existing codebase for patterns
2. Consult the user for clarification
3. Make conservative choices that are easy to change later
4. Update this document with new learnings

---

**Remember:** This project is in its earliest stages. Most decisions haven't been made yet. When in doubt, ask the user before making significant changes or choosing technologies.
