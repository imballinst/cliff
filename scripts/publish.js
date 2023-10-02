const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

const cliPackageJsonPath = path.join(
  process.cwd(),
  'packages/cli/package.json'
);
const cliPackageJson = JSON.parse(fs.readFileSync(cliPackageJsonPath, 'utf-8'));

const parsed = semver.parse(cliPackageJson.version);
const [preid] = parsed.prerelease;

const publishTag = preid ? ` --tag ${preid}` : '';

console.info(
  `Executing npm --workspace @imballinstack/cliff publish${publishTag}...`
);
execSync(`npm --workspace @imballinstack/cliff publish${publishTag}`, {
  stdio: 'inherit'
});
