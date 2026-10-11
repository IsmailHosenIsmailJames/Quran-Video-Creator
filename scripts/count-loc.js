#!/usr/bin/env node

/**
 * Line of Code (LOC) Counter for Quran Video Creator
 * 
 * Analyzes codebase metrics:
 * - Total lines, Code lines, Comment lines, Blank lines
 * - Breakdown by module (Renderer, Remotion, Main, Shared, Preload, Scripts, Configs)
 * - Breakdown by language/file extension (.tsx, .ts, .js, .css, .json, .html)
 * - Optional per-file detail with `--files` or `-f` flag
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// Directories to ignore
const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-electron',
  'release',
  '.git',
  '.gemini',
  'Quran fonts',
  'Quran Scripts',
  'compressed_translation_simple',
  'dist-bundle',
]);

// Extensions to count
const CODE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.json',
  '.html',
]);

// Ignored files (locks, build caches, etc.)
const IGNORED_FILES = new Set([
  'package-lock.json',
  'tsconfig.tsbuildinfo',
]);

function isIgnored(entryPath, stats) {
  const relPath = path.relative(ROOT_DIR, entryPath);
  const segments = relPath.split(path.sep);

  for (const seg of segments) {
    if (IGNORED_DIRS.has(seg)) return true;
  }

  const baseName = path.basename(entryPath);
  if (IGNORED_FILES.has(baseName)) return true;

  if (stats.isFile()) {
    const ext = path.extname(entryPath).toLowerCase();
    if (!CODE_EXTENSIONS.has(ext)) return true;
  }

  return false;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const ext = path.extname(filePath).toLowerCase();

  let totalLines = lines.length;
  // If the last line is empty due to trailing newline, adjust or keep
  if (totalLines > 0 && lines[totalLines - 1] === '') {
    totalLines -= 1;
  }

  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let inBlockComment = false;

  for (let i = 0; i < totalLines; i++) {
    const line = lines[i].trim();

    if (line === '') {
      blankLines++;
      continue;
    }

    if (ext === '.json') {
      codeLines++;
      continue;
    }

    if (inBlockComment) {
      commentLines++;
      if (line.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (line.startsWith('/*')) {
      commentLines++;
      if (!line.includes('*/') || line.indexOf('*/') === line.indexOf('/*')) {
        inBlockComment = true;
      }
      continue;
    }

    if (line.startsWith('//') || line.startsWith('<!--')) {
      commentLines++;
      continue;
    }

    codeLines++;
  }

  return {
    path: path.relative(ROOT_DIR, filePath),
    ext,
    total: totalLines,
    code: codeLines,
    comments: commentLines,
    blanks: blankLines,
  };
}

function walkDir(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (isIgnored(fullPath, entry)) continue;

    if (entry.isDirectory()) {
      files = files.concat(walkDir(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function getModule(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  if (norm.startsWith('src/renderer')) return 'Renderer (UI & Store)';
  if (norm.startsWith('src/remotion')) return 'Remotion Engine';
  if (norm.startsWith('src/main')) return 'Electron Main (Backend/IPC)';
  if (norm.startsWith('src/preload')) return 'Preload Script';
  if (norm.startsWith('src/shared')) return 'Shared Types & Constants';
  if (norm.startsWith('src/')) return 'Other src/ files';
  if (norm.startsWith('scripts/')) return 'Build & Dev Scripts';
  return 'Root Configurations';
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function run() {
  const showFiles = process.argv.includes('--files') || process.argv.includes('-f');
  const allFiles = walkDir(ROOT_DIR);

  const results = allFiles.map(analyzeFile);

  const total = results.reduce(
    (acc, r) => ({
      files: acc.files + 1,
      total: acc.total + r.total,
      code: acc.code + r.code,
      comments: acc.comments + r.comments,
      blanks: acc.blanks + r.blanks,
    }),
    { files: 0, total: 0, code: 0, comments: 0, blanks: 0 }
  );

  // Group by Module
  const byModule = {};
  for (const r of results) {
    const mod = getModule(r.path);
    if (!byModule[mod]) {
      byModule[mod] = { files: 0, total: 0, code: 0, comments: 0, blanks: 0 };
    }
    byModule[mod].files++;
    byModule[mod].total += r.total;
    byModule[mod].code += r.code;
    byModule[mod].comments += r.comments;
    byModule[mod].blanks += r.blanks;
  }

  // Group by Language / Extension
  const byExt = {};
  for (const r of results) {
    const ext = r.ext;
    if (!byExt[ext]) {
      byExt[ext] = { files: 0, total: 0, code: 0, comments: 0, blanks: 0 };
    }
    byExt[ext].files++;
    byExt[ext].total += r.total;
    byExt[ext].code += r.code;
    byExt[ext].comments += r.comments;
    byExt[ext].blanks += r.blanks;
  }

  console.log('\n========================================================================================');
  console.log('                          📊 QURAN VIDEO CREATOR - CODEBASE METRICS');
  console.log('========================================================================================\n');

  // Summary Card
  console.log(`  📁 Total Code Files : ${formatNumber(total.files)}`);
  console.log(`  📜 Total Lines      : ${formatNumber(total.total)}`);
  console.log(`  💻 Code Lines       : ${formatNumber(total.code)} (${((total.code / total.total) * 100).toFixed(1)}%)`);
  console.log(`  💬 Comments         : ${formatNumber(total.comments)} (${((total.comments / total.total) * 100).toFixed(1)}%)`);
  console.log(`  ⚪ Blank Lines      : ${formatNumber(total.blanks)} (${((total.blanks / total.total) * 100).toFixed(1)}%)\n`);

  // Breakdown by Module
  console.log('----------------------------------------------------------------------------------------');
  console.log('  📂 BREAKDOWN BY MODULE');
  console.log('----------------------------------------------------------------------------------------');
  console.log(
    '  ' +
      'Module'.padEnd(30) +
      'Files'.padStart(8) +
      'Lines'.padStart(12) +
      'Code'.padStart(12) +
      'Comments'.padStart(11) +
      'Blanks'.padStart(10)
  );
  console.log('  ' + '-'.repeat(83));

  const sortedModules = Object.entries(byModule).sort((a, b) => b[1].total - a[1].total);
  for (const [mod, m] of sortedModules) {
    console.log(
      '  ' +
        mod.padEnd(30) +
        formatNumber(m.files).padStart(8) +
        formatNumber(m.total).padStart(12) +
        formatNumber(m.code).padStart(12) +
        formatNumber(m.comments).padStart(11) +
        formatNumber(m.blanks).padStart(10)
    );
  }
  console.log('  ' + '-'.repeat(83));
  console.log(
    '  ' +
      'TOTAL'.padEnd(30) +
      formatNumber(total.files).padStart(8) +
      formatNumber(total.total).padStart(12) +
      formatNumber(total.code).padStart(12) +
      formatNumber(total.comments).padStart(11) +
      formatNumber(total.blanks).padStart(10)
  );
  console.log('');

  // Breakdown by Language / Extension
  console.log('----------------------------------------------------------------------------------------');
  console.log('  📝 BREAKDOWN BY FILE TYPE / LANGUAGE');
  console.log('----------------------------------------------------------------------------------------');
  console.log(
    '  ' +
      'Extension'.padEnd(20) +
      'Files'.padStart(10) +
      'Lines'.padStart(14) +
      'Code'.padStart(13) +
      'Comments'.padStart(12) +
      'Blanks'.padStart(12)
  );
  console.log('  ' + '-'.repeat(81));

  const sortedExts = Object.entries(byExt).sort((a, b) => b[1].total - a[1].total);
  for (const [ext, m] of sortedExts) {
    const name =
      ext === '.tsx'
        ? '.tsx (React / TSX)'
        : ext === '.ts'
        ? '.ts (TypeScript)'
        : ext === '.js'
        ? '.js (JavaScript)'
        : ext === '.css'
        ? '.css (Tailwind/CSS)'
        : ext === '.json'
        ? '.json (Config/Data)'
        : ext === '.html'
        ? '.html (HTML)'
        : ext;

    console.log(
      '  ' +
        name.padEnd(20) +
        formatNumber(m.files).padStart(10) +
        formatNumber(m.total).padStart(14) +
        formatNumber(m.code).padStart(13) +
        formatNumber(m.comments).padStart(12) +
        formatNumber(m.blanks).padStart(12)
    );
  }
  console.log('  ' + '-'.repeat(81));
  console.log('');

  // Top 10 Largest Source Files
  console.log('----------------------------------------------------------------------------------------');
  console.log('  🏆 TOP 10 LARGEST SOURCE FILES');
  console.log('----------------------------------------------------------------------------------------');
  const sortedFiles = [...results].sort((a, b) => b.total - a.total).slice(0, 10);
  for (let i = 0; i < sortedFiles.length; i++) {
    const f = sortedFiles[i];
    console.log(
      `  ${String(i + 1).padStart(2)}. ${f.path.padEnd(52)} ${formatNumber(f.total).padStart(6)} lines (${formatNumber(f.code)} code)`
    );
  }
  console.log('');

  if (showFiles) {
    console.log('----------------------------------------------------------------------------------------');
    console.log('  📋 ALL FILES DETAIL');
    console.log('----------------------------------------------------------------------------------------');
    for (const f of [...results].sort((a, b) => a.path.localeCompare(b.path))) {
      console.log(
        `  ${f.path.padEnd(55)} ${formatNumber(f.total).padStart(6)} lines [${formatNumber(f.code)} code, ${formatNumber(f.comments)} comments, ${formatNumber(f.blanks)} blank]`
      );
    }
    console.log('');
  } else {
    console.log('💡 Tip: Run `node scripts/count-loc.js --files` (or `npm run loc -- --files`) to see individual files.\n');
  }
}

run();
