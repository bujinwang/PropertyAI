import { PrismaClient } from '@prisma/client';

async function testMigrationSetup() {
  console.log('🔄 Testing migration setup...');
  
  try {
    const prisma = new PrismaClient();
    console.log('✅ Prisma client initialized successfully');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if Rental model exists
    const rentalCount = await prisma.rental.count();
    console.log(`✅ Rental model accessible, found ${rentalCount} records`);
    
    await prisma.$disconnect();
    console.log('✅ Migration setup test completed successfully');
    
  } catch (error) {
    console.error('❌ Migration setup test failed:', error);
    process.exit(1);
  }
}

testMigrationSetup();