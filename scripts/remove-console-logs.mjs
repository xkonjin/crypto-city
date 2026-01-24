#!/usr/bin/env node

/**
 * Remove Console Logs from Production Build
 * Issue #231: Remove All Console Logs from Production Build
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function findTSFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      const subFiles = await findTSFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function removeConsoleLogs() {
  console.log('🔍 Scanning for console.log statements...\n');
  
  const srcDir = path.join(projectRoot, 'src');
  const files = await findTSFiles(srcDir);
  
  let totalRemoved = 0;
  let filesModified = 0;
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');
    const newLines = [];
    let removed = 0;
    
    for (const line of lines) {
      // Skip lines with console.log, console.warn, console.error (but keep console.error in some cases)
      if (line.match(/console\.(log|warn|debug|info|trace)\(/)) {
        removed++;
        // Comment out instead of removing to preserve line numbers
        newLines.push(line.replace(/^(\s*)/, '$1// [REMOVED] '));
      } else {
        newLines.push(line);
      }
    }
    
    if (removed > 0) {
      await fs.writeFile(file, newLines.join('\n'));
      console.log(`✅ ${path.relative(projectRoot, file)}: ${removed} console statements removed`);
      totalRemoved += removed;
      filesModified++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Console statements removed: ${totalRemoved}`);
  console.log('\n✨ Console log cleanup complete!');
}

removeConsoleLogs().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
