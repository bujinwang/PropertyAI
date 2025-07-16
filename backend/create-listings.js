const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createListings() {
  try {
    // Create listings for existing properties
    const listings = await prisma.listing.createMany({
      data: [
        {
          id: 'listing_1',
          title: 'Modern 2BR in Sunset Apartments',
          description: 'Beautiful 2-bedroom apartment with city views, modern kitchen, and in-unit laundry',
          price: 2500,
          slug: 'sunset-2br-modern',
          status: 'ACTIVE',
          propertyId: 'prop_1',
          unitId: 'unit_1a',
          authorId: 'da9193c9-0f81-49ad-a6b3-0caa4198db7f',
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'listing_2',
          title: 'Luxury 3BR Beachfront Condo',
          description: 'Spacious 3-bedroom condo with ocean views, private balcony, and premium amenities',
          price: 3200,
          slug: 'oceanview-3br-luxury',
          status: 'ACTIVE',
          propertyId: 'prop_2',
          unitId: 'unit_3c',
          authorId: 'da9193c9-0f81-49ad-a6b3-0caa4198db7f',
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });

    console.log('Created listings:', listings.count);
    
    const allListings = await prisma.listing.findMany({
      include: {
        property: true,
        unit: true
      }
    });
    
    console.log('All listings with details:');
    allListings.forEach(listing => {
      console.log(`${listing.title} - $${listing.price}/month at ${listing.property?.name || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error creating listings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createListings();