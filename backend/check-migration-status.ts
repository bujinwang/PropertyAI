import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMigrationStatus() {
  console.log('🔍 Checking migration status...');
  
  try {
    // Check if Rental table exists and has data
    const rentalCount = await prisma.rental.count();
    console.log(`📊 Current rental records: ${rentalCount}`);
    
    // Check if legacy tables exist
    try {
      const propertyCount = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as count FROM "Property"`;
      console.log(`🏢 Legacy Property records: ${propertyCount[0]?.count || 0}`);
    } catch (error) {
      console.log('ℹ️  No Property table found');
    }
    
    try {
      const unitCount = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as count FROM "Unit"`;
      console.log(`🏠 Legacy Unit records: ${unitCount[0]?.count || 0}`);
    } catch (error) {
      console.log('ℹ️  No Unit table found');
    }
    
    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 User records: ${userCount}`);
    
    console.log('✅ Status check completed');
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus();