# Netlify Deployment with Dev Data

## Overview

This project supports two build modes for Netlify:

1. **Production Mode** - Uses full dataset (~41,000 names)
2. **Dev Mode** - Uses top 500 names for faster builds

## How It Works

The `.eleventy.js` config checks the `USE_DEV_DATA` environment variable:
- `USE_DEV_DATA=true` → Uses `boys-dev.json` & `girls-dev.json` (top 500 each)
- Not set or `false` → Uses full `boys.json` & `girls.json` (all names)

## Netlify Configuration

### Current Setup (in `netlify.toml`):

**Production builds (main branch):**
- Uses FULL data (all 41,000+ names)
- Slower builds (~2-5 minutes)
- Complete site with all names

**Deploy previews & branch deploys:**
- Uses DEV data (top 500 names)
- Fast builds (~30 seconds)
- Good for testing changes quickly

### Deployment Contexts

The `netlify.toml` is configured with three contexts:

#### 1. Production (main branch)
```toml
[build]
  command = "npm run build"
  publish = "_site"
```
- **Build time:** 2-5 minutes
- **Data:** Full dataset (41,570 names)
- **Pages:** Thousands of HTML files
- **Use case:** Live production site

#### 2. Deploy Previews (Pull Requests)
```toml
[context.deploy-preview]
  command = "npm run dev:data && npm run build"
  [context.deploy-preview.environment]
    USE_DEV_DATA = "true"
```
- **Build time:** ~30 seconds
- **Data:** Top 500 names per gender
- **Pages:** ~1,000 HTML files
- **Use case:** Quick PR previews for testing

#### 3. Branch Deploys
```toml
[context.branch-deploy]
  command = "npm run dev:data && npm run build"
  [context.branch-deploy.environment]
    USE_DEV_DATA = "true"
```
- **Build time:** ~30 seconds
- **Data:** Top 500 names per gender
- **Use case:** Testing feature branches

## Testing Locally

### Full Production Build
```bash
npm run build
```

### Dev Data Build
```bash
# Generate dev data files first (only needed once)
npm run dev:data

# Build with dev data
npm run build:dev

# Or run dev server with dev data
npm run dev:fast
```

## Build Time Comparison

| Mode | Data Size | Names | Pages | Build Time |
|------|-----------|-------|-------|------------|
| Production | 44 MB | 41,570 | ~42,000 | 2-5 min |
| Dev | 1.1 MB | 1,000 | ~1,000 | ~30 sec |

**Speedup:** ~10x faster builds with dev data

## Using Dev Mode for Production (Testing)

If you want to test Netlify deployment with dev data first:

1. **Option A:** Edit `netlify.toml` to enable dev mode for production:
   ```toml
   [build.environment]
     NODE_VERSION = "18"
     USE_DEV_DATA = "true"  # Uncomment this line
   ```

2. **Option B:** Set environment variable in Netlify UI:
   - Go to Site settings → Build & deploy → Environment
   - Add: `USE_DEV_DATA` = `true`

3. **Option C:** Use a separate branch for testing:
   - Push to a feature branch
   - Netlify will auto-deploy with dev data
   - Test before merging to main

## Switching Back to Production

To use full data for production builds:

1. Remove or comment out `USE_DEV_DATA` in `netlify.toml`:
   ```toml
   [build.environment]
     NODE_VERSION = "18"
     # USE_DEV_DATA = "true"  # Commented out = production mode
   ```

2. Or delete the environment variable in Netlify UI

## Troubleshooting

### Build fails: "Cannot find module 'boys-dev.json'"

**Cause:** Dev data files don't exist on Netlify

**Solution:** The build command should include `npm run dev:data`:
```toml
command = "npm run dev:data && npm run build"
```

### Deploy preview shows full data

**Cause:** Context-specific settings not applied

**Solution:** Check `netlify.toml` has `[context.deploy-preview]` section with `USE_DEV_DATA = "true"`

### Local dev server slow

**Cause:** Using full production data

**Solution:** Use fast dev mode:
```bash
npm run dev:fast
```

## Recommendations

**For most users:**
- Keep the default `netlify.toml` configuration
- Production deploys use full data
- PR previews use dev data for speed
- Best of both worlds!

**For initial testing:**
- Enable dev mode temporarily to test Netlify setup
- Faster iteration during configuration
- Switch to production mode when ready

**For development:**
- Use `npm run dev:fast` locally
- Much faster page regeneration
- Good for template/CSS work

## Files Reference

- **netlify.toml** - Netlify build configuration
- **.eleventy.js** - 11ty config with dev data support
- **scripts/create-dev-data.js** - Generates dev data files
- **data/boys-dev.json** - Dev data (gitignored)
- **data/girls-dev.json** - Dev data (gitignored)
