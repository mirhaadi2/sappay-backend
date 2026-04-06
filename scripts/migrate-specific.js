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
  
  const migrations = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.cjs'));
  migrations.forEach((file, i) => {
    log(`  ${i + 1}. ${file.replace(/\.(ts|js|cjs)$/, '')}`, 'cyan');
  });
  
  log('\nExample:\n  npm run migrate:specific -- add-deleted_at-column', 'yellow');
  process.exit(1);
}

try {
  log('\n════════════════════════════════════════════════════════════', 'cyan');
  log('  RUN SPECIFIC MIGRATION', 'cyan');
  log('════════════════════════════════════════════════════════════', 'cyan');

  // Find migration file (supports .ts, .js, and .cjs)
  const migrations = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.cjs'));
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
  
  let statusOutput = '';
  try {
    statusOutput = execSync('npx sequelize-cli db:migrate:status', { encoding: 'utf-8' });
  } catch (e) {
    log('⚠️  Could not get migration status, attempting to run anyway...', 'yellow');
  }
  
  const isPending = statusOutput.includes(`down ${matchedFile}`) || statusOutput.includes(`pending`);
  const isApplied = statusOutput.includes(`up ${matchedFile}`) || statusOutput.includes(`executed`);

  if (isApplied) {
    log(`⚠️  Migration already applied: ${matchedFile}`, 'yellow');
    log('If you need to re-run it, manually edit the _prisma_migrations table', 'yellow');
    process.exit(0);
  }

  log(`\n🚀 Running migration: ${matchedFile}`, 'blue');
  log('   (This runs all pending migrations in sequence)\n', 'yellow');
  
  // Run migrations with error handling for idempotency
  try {
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    log('\n✅ Migration executed successfully!', 'green');
  } catch (migrationError) {
    const errorMsg = migrationError.toString();
    
    // Check if error is due to already existing columns/constraints (idempotency issue)
    if (errorMsg.includes('already exists') || errorMsg.includes('duplicate key') || errorMsg.includes('already defined')) {
      log('\n⚠️  Migration may have already been applied or contains idempotent operations', 'yellow');
      log('Continuing verification...', 'yellow');
    } else {
      throw migrationError;
    }
  }

  log('\n📋 Verifying:\n', 'blue');
  try {
    execSync('npx sequelize-cli db:migrate:status', { stdio: 'inherit' });
  } catch (e) {
    log('⚠️  Could not verify status', 'yellow');
  }

} catch (error) {
  log('\n❌ Error:', 'red');
  log(error instanceof Error ? error.message : error, 'red');
  log('\n💡 Troubleshooting:', 'blue');
  log('  1. Check if migration is already applied: npm run migration:status', 'cyan');
  log('  2. Verify database connection in .env file', 'cyan');
  log('  3. For persistent issues, restore from backup: npm run migrate:restore', 'cyan');
  process.exit(1);
}
