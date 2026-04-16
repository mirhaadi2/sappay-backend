/**
 * Script to identify duplicate promotions in the database
 * Run: node scripts/find-duplicate-promotions.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

async function findDuplicatePromotions() {
  try {
    console.log('🔍 Finding duplicate promotions...\n');

    // Using raw SQL to find duplicates
    const query = `
      SELECT 
        title, 
        type,
        COUNT(*) as count,
        json_agg(json_build_object('id', id, 'createdAt', created_at)) as entries
      FROM promotions
      WHERE deleted_at IS NULL
      GROUP BY title, type
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `;

    // Note: This would need database connection set up
    // For now, we'll provide manual SQL that user can run
    console.log('📋 To find duplicates, run one of these queries:\n');
    
    console.log('PostgreSQL Query:');
    console.log(query);
    console.log('\n---\n');

    console.log('If duplicates exist, you can delete the older entries:\n');
    console.log(`
    -- Show duplicates with their IDs
    SELECT 
      title, 
      id, 
      created_at,
      row_number() OVER (PARTITION BY title, type ORDER BY created_at DESC) as rn
    FROM promotions
    WHERE deleted_at IS NULL
    ORDER BY title, created_at;

    -- Delete older duplicates (keep the most recent one)
    DELETE FROM promotions
    WHERE id IN (
      SELECT id FROM (
        SELECT 
          id,
          row_number() OVER (PARTITION BY title, type ORDER BY created_at DESC) as rn
        FROM promotions
        WHERE deleted_at IS NULL
      ) t
      WHERE rn > 1
    );
    `);

    console.log('\n✅ After deleting duplicates, restart your server to see the changes.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findDuplicatePromotions();
