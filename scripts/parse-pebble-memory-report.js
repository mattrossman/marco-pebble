#!/usr/bin/env node

const fs = require('node:fs');

const MEMORY_BLOCK_PATTERN =
  /^(?<platform>[A-Z0-9_]+) APP MEMORY USAGE\s*\r?\nTotal size of resources:\s*(?<resources>[\d,]+) bytes \/ (?<resourcesCap>[^\r\n]+)\r?\nTotal footprint in RAM:\s*(?<ram>[\d,]+) bytes \/ (?<ramCap>[^\r\n]+)\r?\nFree RAM available \(heap\):\s*(?<free>[\d,]+) bytes$/gm;

function parsePebbleMemoryReport(logText) {
  const entries = [];

  for (const match of logText.matchAll(MEMORY_BLOCK_PATTERN)) {
    if (match.groups) {
      entries.push({
        platform: match.groups.platform,
        resources: match.groups.resources,
        resourcesCap: match.groups.resourcesCap.trim(),
        ram: match.groups.ram,
        ramCap: match.groups.ramCap.trim(),
        free: match.groups.free,
      });
    }
  }

  return entries;
}

function humanizePlatform(platform) {
  return platform.charAt(0) + platform.slice(1).toLowerCase();
}

function formatBytes(value) {
  return Number(value.replace(/,/g, '')).toLocaleString('en-US');
}

function formatFreeHeapPercent(ram, free) {
  const ramBytes = Number(ram.replace(/,/g, ''));
  const freeBytes = Number(free.replace(/,/g, ''));
  const heapBytes = ramBytes + freeBytes;

  return heapBytes ? `${((freeBytes / heapBytes) * 100).toFixed(1)}%` : '0.0%';
}

function renderPebbleMemoryReport(entries) {
  if (!entries.length) {
    return '_No memory usage blocks were found in the build log._';
  }

  const lines = [
    '### Memory usage',
    '',
    '| Platform | Resources | RAM footprint | Free heap |',
    '| --- | ---: | ---: | ---: |',
  ];

  for (const entry of entries) {
    lines.push(
      `| ${humanizePlatform(entry.platform)} | ${formatBytes(entry.resources)} bytes / ${entry.resourcesCap} | ${formatBytes(entry.ram)} bytes / ${entry.ramCap} | ${formatBytes(entry.free)} bytes (${formatFreeHeapPercent(entry.ram, entry.free)} free) |`,
    );
  }

  lines.push('', `Parsed ${entries.length} platform${entries.length === 1 ? '' : 's'} from the build log.`);
  return lines.join('\n');
}

if (require.main === module) {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error('Usage: parse-pebble-memory-report.js <build-log-path>');
    process.exit(1);
  }

  const logText = fs.readFileSync(inputPath, 'utf8');
  process.stdout.write(renderPebbleMemoryReport(parsePebbleMemoryReport(logText)));
}

module.exports = {
  humanizePlatform,
  parsePebbleMemoryReport,
  formatFreeHeapPercent,
  renderPebbleMemoryReport,
};
