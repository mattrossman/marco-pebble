#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const profile = process.argv[2] || 'release';
if (profile !== 'dev' && profile !== 'release') {
  console.error('Usage: prepare-package.js [dev|release]');
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function merge(base, overlay) {
  const result = { ...base };

  for (const [key, value] of Object.entries(overlay)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = merge(result[key] || {}, value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

const template = readJson(path.resolve('package.template.json'));
const profileData = readJson(path.resolve(`profiles/package.${profile}.json`));
const packageJson = merge(template, profileData);
fs.writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
console.log(`prepared package.json using ${profile} profile`);
