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
      location: `${properties[0].city}, ${properties[0].state}`,
      averageRent: 2050.00,
      vacancyRate: 0.05,
      dataDate: new Date('2025-05-01'),
      propertyType: PropertyType.APARTMENT,
      bedrooms: 2,
    },
    {
      location: `${properties[0].city}, ${properties[0].state}`,
      averageRent: 2150.00,
      vacancyRate: 0.04,
      dataDate: new Date('2025-05-15'),
      propertyType: PropertyType.APARTMENT,
      bedrooms: 2,
    },
  ];

  for (const data of marketData) {
    await prisma.marketData.create({
      data,
    });
  }
};
