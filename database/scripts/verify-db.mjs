#!/usr/bin/env node
/**
 * e-Milap — Database Verification Script (Non-destructive)
 *
 * Inspects database connectivity, PostgreSQL version, installed extensions,
 * public schema tables, and migration status without altering any data.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auto-load .env from repository root if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile(envPath); } catch {}
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  console.error('Please configure DATABASE_URL in your local .env file.');
  process.exit(1);
}

const isSslExplicitlyDisabled = databaseUrl.includes('sslmode=disable');
const isSslRequired = !isSslExplicitlyDisabled && (
  databaseUrl.includes('sslmode=require') ||
  databaseUrl.includes('supabase') ||
  (process.env.NODE_ENV === 'production' && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1') && !databaseUrl.includes('postgres:5432') && !databaseUrl.includes('172.'))
);

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: isSslRequired ? { rejectUnauthorized: false } : false,
});

async function run() {
  console.log('Connecting to PostgreSQL database...');
  await client.connect();
  console.log('✓ Successfully connected.');

  // 1. Version info
  const { rows: verRows } = await client.query('SELECT version();');
  console.log(`  Database version: ${verRows[0].version.split(',')[0]}`);

  // 2. Check extensions
  const { rows: extRows } = await client.query(
    "SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'pgcrypto') ORDER BY extname;"
  );
  if (extRows.length > 0) {
    console.log(`  Installed extensions: ${extRows.map((r) => `${r.extname} (v${r.extversion})`).join(', ')}`);
  } else {
    console.log('  Installed extensions: None of (vector, pgcrypto) installed yet.');
  }

  // 3. Check public schema tables
  const { rows: tableRows } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
  );
  const tables = tableRows.map((r) => r.table_name);
  console.log(`  Public schema tables count: ${tables.length}`);
  if (tables.length > 0) {
    console.log(`  Tables found: ${tables.join(', ')}`);
  } else {
    console.log('  Schema state: Clean / Empty (ready for initial migration)');
  }

  // 4. Check migrations status if _migrations exists
  if (tables.includes('_migrations')) {
    const { rows: migRows } = await client.query(
      'SELECT id, name, applied_at FROM _migrations ORDER BY id ASC;'
    );
    console.log(`  Migration records (${migRows.length} applied):`);
    for (const m of migRows) {
      console.log(`    [✓] #${m.id} ${m.name} (applied ${new Date(m.applied_at).toISOString()})`);
    }
  }

  await client.end();
}

function sanitize(msg) {
  if (!msg) return '';
  return String(msg).replace(/:\/\/[^:]+:[^@]+@/g, '://[REDACTED]:[REDACTED]@');
}

run().catch((err) => {
  console.error('Database verification error:', sanitize(err.message || err));
  process.exit(1);
});
