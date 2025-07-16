const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkListings() {
  try {
    const listings = await prisma.listing.findMany();
    console.log('Listings found:', listings.length);
    console.log(JSON.stringify(listings, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkListings();