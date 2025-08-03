#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

async function fixPrismaSchema() {
  try {
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔧 Fixing Prisma schema...');
    
    // Fix id fields - add @default(cuid()) to String @id fields that don't have defaults
    const idMatches = schemaContent.match(/(\s+id\s+String\s+@id)(?!\s+@default)/g);
    if (idMatches) {
      console.log(`  - Found ${idMatches.length} id fields to fix`);
      schemaContent = schemaContent.replace(
        /(\s+id\s+String\s+@id)(?!\s+@default)/g,
        '$1 @default(cuid())'
      );
    }
    
    // Fix updatedAt fields - add @updatedAt to DateTime updatedAt fields that don't have it
    const updatedAtMatches = schemaContent.match(/(\s+updatedAt\s+DateTime)(?!\s+@updatedAt)/g);
    if (updatedAtMatches) {
      console.log(`  - Found ${updatedAtMatches.length} updatedAt fields to fix`);
      schemaContent = schemaContent.replace(
        /(\s+updatedAt\s+DateTime)(?!\s+@updatedAt)/g,
        '$1 @updatedAt'
      );
    }
    
    // Write the fixed schema back
    fs.writeFileSync(schemaPath, schemaContent);
    
    console.log('✅ Fixed Prisma schema successfully!');
    console.log('  - Added @default(cuid()) to id fields');
    console.log('  - Added @updatedAt to updatedAt fields');
    console.log('\n🔄 Now run: npx prisma generate');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    process.exit(1);
  }
}

fixPrismaSchema();