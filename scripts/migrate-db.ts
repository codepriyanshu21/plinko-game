import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  try {
    console.log('[v0] Starting database migration...');
    
    // Read and execute the SQL file
    const sqlPath = resolve(__dirname, 'create-round-table.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    
    for (const statement of statements) {
      console.log(`[v0] Executing: ${statement.substring(0, 50)}...`);
      await sql.query(statement);
    }
    
    console.log('[v0] Database migration completed successfully!');
  } catch (error) {
    console.error('[v0] Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
