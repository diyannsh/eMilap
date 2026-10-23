#!/usr/bin/env node
/**
 * e-Milap — Production Database Migration Runner
 * 
 * Safely applies sequential SQL migrations with tracking, transactions,
 * and idempotency.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require" node database/scripts/migrate.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../migrations');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const isSslExplicitlyDisabled = databaseUrl.includes('sslmode=disable');
const isSslRequired = !isSslExplicitlyDisabled && (
  databaseUrl.includes('sslmode=require') ||
  (process.env.NODE_ENV === 'production' && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1') && !databaseUrl.includes('postgres:5432') && !databaseUrl.includes('172.'))
);

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: isSslRequired ? { rejectUnauthorized: false } : false,
});

async function run() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected successfully.');

  try {
    // 1. Create migration ledger table if it does not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Fetch already applied migrations
    const { rows: appliedRows } = await client.query('SELECT name FROM _migrations;');
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    // 3. Discover and sort migration files
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const isBaseline = process.argv.includes('--baseline');

    console.log(`Found ${files.length} total migration file(s).`);

    let appliedCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  [SKIPPED] ${file} (already applied)`);
        continue;
      }

      if (isBaseline) {
        console.log(`  [BASELINE] Marking ${file} as already applied...`);
        await client.query('INSERT INTO _migrations (name) VALUES ($1);', [file]);
        appliedCount++;
        continue;
      }

      console.log(`  [APPLYING] ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      const startTime = Date.now();
      await client.query('BEGIN;');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1);', [file]);
        await client.query('COMMIT;');
        const duration = Date.now() - startTime;
        console.log(`  [SUCCESS]  ${file} applied in ${duration}ms`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK;');
        console.error(`  [FAILED]   Error executing migration ${file}:`, err.message);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('Database is already up to date. No new migrations to apply.');
    } else {
      console.log(`Successfully applied ${appliedCount} migration(s).`);
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
