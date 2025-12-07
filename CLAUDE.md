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
4. [Development Workflows](#development-workflows)
5. [Key Conventions](#key-conventions)
6. [Technology Stack](#technology-stack)
7. [Common Tasks](#common-tasks)
8. [Git Workflow](#git-workflow)
9. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Overview

### Purpose
The-names-website is a web application designed for thinking about, exploring, and working with names. The specific functionality and features are to be determined as the project develops.

### Current Status
🚀 **EARLY STAGE INITIALIZATION** - This repository is in its earliest stages. Only the README.md exists. No technology stack has been chosen, no source code exists, and no build system is configured.

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

### What Doesn't Exist Yet
- ❌ Source code directories
- ❌ Package manager configuration (package.json)
- ❌ Build system
- ❌ Testing framework
- ❌ CI/CD pipelines
- ❌ Development environment setup
- ❌ Technology stack selection

### Next Steps for Development
1. **Choose Technology Stack** - Select frontend framework, build tools, and dependencies
2. **Initialize Package Manager** - Create package.json and install dependencies
3. **Create Project Structure** - Set up source directories and file organization
4. **Configure Build Tools** - Set up bundler/compiler (Vite, Webpack, etc.)
5. **Establish Code Conventions** - Linting, formatting, and style guidelines
6. **Set Up Development Environment** - Local dev server and hot reloading

---

## Repository Structure

### Recommended Future Structure

Once development begins, consider this conventional structure for a modern web application:

```
the-names-website/
├── .git/                   # Git version control
├── .github/                # GitHub-specific files
│   └── workflows/          # CI/CD workflows
├── public/                 # Static assets
│   ├── favicon.ico
│   └── images/
├── src/                    # Source code
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page components/routes
│   ├── styles/            # CSS/styling files
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom React hooks (if using React)
│   ├── services/          # API services and data fetching
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── tests/                  # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .gitignore             # Git ignore rules
├── .env.example           # Environment variable template
├── package.json           # Node.js dependencies and scripts
├── tsconfig.json          # TypeScript configuration (if using TS)
├── vite.config.ts         # Build tool configuration
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

## Development Workflows

### Initial Setup Workflow

When setting up the project for the first time:

1. **Consult with User** - Always confirm technology choices before initializing
   - Frontend framework (React, Vue, Svelte, etc.)
   - Build tool (Vite, Webpack, Parcel, etc.)
   - Language (TypeScript recommended vs JavaScript)
   - Styling approach (CSS Modules, Tailwind, styled-components, etc.)

2. **Initialize Package Manager**
   ```bash
   npm init -y
   # or
   yarn init -y
   # or
   pnpm init
   ```

3. **Install Dependencies**
   - Install chosen framework and build tools
   - Set up development dependencies (linters, formatters)
   - Configure testing framework

4. **Create Project Structure**
   - Create src/ directory and subdirectories
   - Set up public/ for static assets
   - Initialize configuration files

5. **Configure Tooling**
   - Set up linting (ESLint)
   - Configure formatting (Prettier)
   - Set up pre-commit hooks if needed

6. **Verify Setup**
   - Ensure dev server runs
   - Create a simple "Hello World" component
   - Verify build process works

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

#### Component Guidelines (for React/Vue/Svelte)
- Prefer functional components over class components
- Keep components small and focused
- Extract complex logic to custom hooks/composables
- Use meaningful prop names

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

### Status: NOT YET DETERMINED

The technology stack has not been chosen. When selecting technologies, consider:

#### Frontend Framework Options
- **React** - Most popular, large ecosystem, good for complex applications
- **Vue** - Progressive framework, easier learning curve, flexible
- **Svelte** - Compiled framework, less boilerplate, excellent performance
- **Solid** - Reactive framework, excellent performance, smaller ecosystem
- **Vanilla JavaScript/TypeScript** - For simpler projects, no framework overhead

#### Build Tools Options
- **Vite** - Modern, fast, great developer experience (recommended)
- **Webpack** - Mature, extensive plugin ecosystem
- **Parcel** - Zero-config bundler, good for smaller projects
- **esbuild** - Extremely fast, minimal configuration

#### Language
- **TypeScript** - Recommended for type safety and better developer experience
- **JavaScript** - Simpler, faster to write for small projects

#### Styling Options
- **CSS Modules** - Scoped CSS, works with any framework
- **Tailwind CSS** - Utility-first CSS framework, rapid development
- **styled-components** - CSS-in-JS for React
- **Sass/SCSS** - CSS preprocessor with variables and mixins
- **Vanilla CSS** - Simple, no dependencies

#### Testing (when needed)
- **Vitest** - Fast, Vite-native testing framework
- **Jest** - Popular, comprehensive testing framework
- **Testing Library** - User-centric component testing
- **Playwright/Cypress** - E2E testing

### Technology Decision Process

When an AI assistant is asked to set up the project:

1. **Ask the user** what technologies they prefer
2. If user has no preference, recommend modern defaults:
   - **Vite + React + TypeScript** (most popular)
   - **Vite + Vue + TypeScript** (simpler alternative)
   - **Vite + Svelte + TypeScript** (modern, performant)
3. Document the decision in this file
4. Proceed with setup

---

## Common Tasks

### Starting Development Server
```bash
# Once package.json exists
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Building for Production
```bash
npm run build
# or
yarn build
# or
pnpm build
```

### Running Tests
```bash
npm test
# or
yarn test
# or
pnpm test
```

### Linting Code
```bash
npm run lint
# or
yarn lint
# or
pnpm lint
```

### Installing Dependencies
```bash
npm install <package-name>
# or
yarn add <package-name>
# or
pnpm add <package-name>
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
- Keep components small and focused

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
