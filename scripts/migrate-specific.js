#!/usr/bin/env node

/**
 * Run a Specific Migration by Name
 * Usage: npm run migrate:specific -- add-deleted_at-column
 * 
 * This runs a specific pending migration
 */

import 'dotenv/config.js';
import { execSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '../src/db/migrations');
const migrationSearch = process.argv.slice(2).join(' ');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

if (!migrationSearch.trim()) {
  log('\n❌ Migration name required!', 'red');
  log('\nUsage: npm run migrate:specific -- add-deleted_at-column', 'yellow');
  log('\nAvailable migrations:\n', 'blue');
  
  const migrations = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.js') || f.endsWith('.cjs'));
  migrations.forEach((file, i) => {
    log(`  ${i + 1}. ${file.replace(/\.(js|cjs)$/, '')}`, 'cyan');
  });
  
  log('\nExample:\n  npm run migrate:specific -- add-deleted_at-column', 'yellow');
  process.exit(1);
}

try {
  log('\n════════════════════════════════════════════════════════════', 'cyan');
  log('  RUN SPECIFIC MIGRATION', 'cyan');
  log('════════════════════════════════════════════════════════════', 'cyan');

  // Find migration file (supports both .js and .cjs)
  const migrations = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.js') || f.endsWith('.cjs'));
  const matchedFile = migrations.find(f => f.toLowerCase().includes(migrationSearch.toLowerCase()));

  if (!matchedFile) {
    log(`\n❌ Migration not found: "${migrationSearch}"`, 'red');
    log('\nAvailable migrations:', 'yellow');
    migrations.forEach((file, i) => {
      log(`  ${i + 1}. ${file.replace(/\.(js|cjs)$/, '')}`, 'cyan');
    });
    process.exit(1);
  }

  log(`\n✅ Found migration: ${matchedFile}`, 'green');

  // Check if migration is pending
  log('\n🔍 Checking migration status...\n', 'blue');
  const statusOutput = execSync('npx sequelize-cli db:migrate:status', { encoding: 'utf-8' });
  
  const isPending = statusOutput.includes(`down ${matchedFile}`);
  const isApplied = statusOutput.includes(`up ${matchedFile}`);

  if (isApplied) {
    log(`⚠️  Migration already applied: ${matchedFile}`, 'yellow');
    process.exit(0);
  }

  if (!isPending) {
    log(`⚠️  Migration status unknown. Current status:\n`, 'yellow');
    console.log(statusOutput);
    process.exit(0);
  }

  log(`\n🚀 Running migration: ${matchedFile}`, 'blue');
  log('   (This runs all pending migrations in sequence)\n', 'yellow');
  
  // Run migrations - this will run all pending ones in order
  execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });

  log('\n✅ Migration executed!', 'green');
  log('\n📋 Verifying:\n', 'blue');
  execSync('npx sequelize-cli db:migrate:status', { stdio: 'inherit' });

} catch (error) {
  log('\n❌ Error:', 'red');
  log(error instanceof Error ? error.message : error, 'red');
  process.exit(1);
}
