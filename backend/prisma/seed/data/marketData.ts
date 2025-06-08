import { PrismaClient, PropertyType } from '@prisma/client';

const prisma = new PrismaClient();

export const seedMarketData = async () => {
  const properties = await prisma.property.findMany();

  if (properties.length === 0) {
    console.log('No properties found, skipping market data seeding.');
    return;
  }

  const marketData = [
    {
      propertyId: properties[0].id,
      date: new Date('2025-05-01'),
      source: 'Zillow',
      price: 2000,
      pricePerSqFt: 2.5,
      bedrooms: 2,
      bathrooms: 1,
      zipCode: properties[0].zipCode,
      city: properties[0].city,
      state: properties[0].state,
      propertyType: PropertyType.APARTMENT,
    },
    {
      propertyId: properties[0].id,
      date: new Date('2025-05-15'),
      source: 'Redfin',
      price: 2100,
      pricePerSqFt: 2.6,
      bedrooms: 2,
      bathrooms: 1,
      zipCode: properties[0].zipCode,
      city: properties[0].city,
      state: properties[0].state,
      propertyType: PropertyType.APARTMENT,
    },
  ];

  for (const data of marketData) {
    await prisma.marketData.create({
      data,
    });
  }
};
