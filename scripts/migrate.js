const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config();

async function migrate() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const initialSchema = fs.readFileSync('migrations/001_initial_schema.sql', 'utf8');
    const usersSchema = fs.readFileSync('migrations/002_add_users_table.sql', 'utf8');
    const schema = initialSchema + '\n' + usersSchema;
    
    console.log('Starting migration...');
    // Split the schema into individual statements and execute them sequentially
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await sql(statement);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();