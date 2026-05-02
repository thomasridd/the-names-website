const { execSync } = require('child_process');

function detectBuildMode() {
  let USE_DEV_DATA;

  if (process.env.USE_DEV_DATA !== undefined) {
    USE_DEV_DATA = process.env.USE_DEV_DATA === 'true';
    console.log(`\n🔧 Manual override: USE_DEV_DATA=${USE_DEV_DATA}`);
  } else {
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      USE_DEV_DATA = currentBranch !== 'main';
      console.log(`\n🔧 Auto-detected branch: "${currentBranch}"`);
    } catch (error) {
      USE_DEV_DATA = true;
      console.log(`\n⚠️  Could not detect git branch, defaulting to dev data`);
    }
  }

  const dataSuffix = USE_DEV_DATA ? '-dev.json' : '.json';
  console.log(`🔧 Build mode: ${USE_DEV_DATA ? 'DEVELOPMENT (top 500 names)' : 'PRODUCTION (all names)'}`);
  console.log(`📁 Data files: boys${dataSuffix} & girls${dataSuffix}\n`);

  return { USE_DEV_DATA, dataSuffix };
}

module.exports = { detectBuildMode };
