const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProperties() {
  try {
    const properties = await prisma.property.findMany({
      include: {
        units: true,
        images: true
      }
    });
    console.log('Properties found:', properties.length);
    console.log(JSON.stringify(properties, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProperties();