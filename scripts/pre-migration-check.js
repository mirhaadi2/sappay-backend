#!/usr/bin/env node

/**
 * Pre-migration validation script
 * Checks database and pending migrations before executing
 * usage: node scripts/pre-migration-check.js
 */

import { sequelize } from '../src/db/sequelize.js';
import { execSync } from 'child_process';

async function preChecks() {
  try {
    console.log('🔍 Pre-Migration Checks...\n');

    // 1. Database connectivity
    console.log('1️⃣  Testing database connectivity...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // 2. Check for pending migrations
    console.log('2️⃣  Checking pending migrations...');
    const status = execSync('sequelize-cli db:migrate:status', {
      encoding: 'utf-8',
    });
    
    const pendingMigrations = status.split('\n').filter(line => 
      line.includes('down') && !line.includes('========')
    );

    if (pendingMigrations.length === 0) {
      console.log('ℹ️  No pending migrations\n');
      return true;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations:\n`);
    pendingMigrations.forEach(line => console.log(`   ${line.trim()}`));
    console.log();

    // 3. Backup check (production only)
    if (process.env.NODE_ENV === 'production') {
      console.log('3️⃣  ⚠️  PRODUCTION MODE - Ensure database backup exists!');
      console.log('   Backup timestamp: ', new Date().toISOString());
      console.log('   Command: pg_dump $DATABASE_URL > backup-$(date +%s).sql\n');
      
      if (!process.env.BACKUP_VERIFIED) {
        console.error('❌ Backup not verified. Set BACKUP_VERIFIED=true after backing up.\n');
        process.exit(1);
      }
    }

    console.log('✅ All pre-checks passed\n');
    await sequelize.close();
    return true;

  } catch (error) {
    console.error('❌ Pre-migration check failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

preChecks();