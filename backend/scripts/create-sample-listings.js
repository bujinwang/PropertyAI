const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSampleListings() {
  try {
    console.log('Creating sample listings...');
    
    // Clear existing listings first
    console.log('Clearing existing listings...');
    await prisma.listing.deleteMany({});
    
    // Get the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@propertyai.com' }
    });
    
    if (!adminUser) {
      console.error('Admin user not found. Please run the seed script first.');
      return;
    }
    
    // Get or create a property
    let property = await prisma.property.findFirst();
    if (!property) {
      property = await prisma.property.create({
        data: {
          name: 'Sample Property',
          address: '789 Sample St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94103',
          country: 'USA',
          propertyType: 'APARTMENT',
          totalUnits: 10,
          managerId: adminUser.id,
          ownerId: adminUser.id
        }
      });
    }
    
    // Create multiple units for listings
    const units = [];
    const unitData = [
      { unitNumber: '4D', bedrooms: 2, bathrooms: 2, size: 950, rent: 2800 },
      { unitNumber: '5A', bedrooms: 1, bathrooms: 1, size: 650, rent: 2200 },
      { unitNumber: '6B', bedrooms: 3, bathrooms: 2.5, size: 1200, rent: 3500 }
    ];
    
    for (const data of unitData) {
      // Check if unit already exists
      let unit = await prisma.unit.findFirst({
        where: {
          unitNumber: data.unitNumber,
          propertyId: property.id
        }
      });
      
      if (!unit) {
        unit = await prisma.unit.create({
          data: {
            ...data,
            isAvailable: true,
            propertyId: property.id
          }
        });
      }
      
      units.push(unit);
    }
    
    // Create sample listings
    const sampleListings = [
      {
        slug: 'luxury-2br-sunset-apartments',
        title: 'Luxury 2BR Apartment in Sunset District',
        description: 'Beautiful 2-bedroom, 2-bathroom apartment with modern amenities, hardwood floors, and stunning city views. Located in the heart of San Francisco with easy access to public transportation.',
        price: 2800,
        status: 'ACTIVE',
        publishedAt: new Date(),
        unitId: units[0].id,
        propertyId: property.id,
        authorId: adminUser.id
      },
      {
        slug: 'cozy-1br-downtown-condo',
        title: 'Cozy 1BR Downtown Condo',
        description: 'Charming 1-bedroom condo in downtown area. Perfect for young professionals. Features include in-unit laundry, modern kitchen, and rooftop access.',
        price: 2200,
        status: 'ACTIVE',
        publishedAt: new Date(),
        unitId: units[1].id,
        propertyId: property.id,
        authorId: adminUser.id
      },
      {
        slug: 'spacious-3br-family-home',
        title: 'Spacious 3BR Family Home',
        description: 'Perfect family home with 3 bedrooms, 2.5 bathrooms, large backyard, and garage. Located in a quiet neighborhood with excellent schools nearby.',
        price: 3500,
        status: 'DRAFT',
        unitId: units[2].id,
        propertyId: property.id,
        authorId: adminUser.id
      }
    ];
    
    for (const listingData of sampleListings) {
      const listing = await prisma.listing.create({
        data: listingData
      });
      console.log(`Created listing: ${listing.title}`);
    }
    
    console.log('Sample listings created successfully!');
    
  } catch (error) {
    console.error('Error creating sample listings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleListings();