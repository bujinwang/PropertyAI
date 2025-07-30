import { Listing, Property, Unit } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';

interface ListingSeoData {
  title: string;
  description: string;
  address: string;
  propertyType: string;
  rent: number; // Changed price to rent
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFootage?: number | null;
  amenities?: any;
}

export const prepareListingSeoData = (listing: Listing & { property: Property; unit: Unit }): ListingSeoData => {
  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  return {
    title: listing.title,
    description: listing.description,
    address: `${listing.property.address}, ${listing.property.city}, ${listing.property.state} ${listing.property.zipCode}`,
    propertyType: listing.property.propertyType,
    rent: listing.rent, // Changed price to rent
    bedrooms: listing.unit.bedrooms,
    bathrooms: listing.unit.bathrooms,
    squareFootage: listing.unit.size,
    amenities: listing.property.amenities,
  };
};

export const generateSlug = async (title: string, city: string, propertyType: string): Promise<string> => {
  const slugify = (text: string) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  let slug = slugify(`${propertyType}-in-${city}-${title}`);
  
  // ensure uniqueness
  const prisma = new (await import('@prisma/client')).PrismaClient();
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.listing.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
};

export const generateMetaTags = (seoData: ListingSeoData) => {
  const { title, description, propertyType, address } = seoData;
  const metaTitle = `${propertyType} in ${address} - ${title} | PropertyAI`;
  const metaDescription = description.substring(0, 160);
  return { metaTitle, metaDescription };
};

export const generateJsonLd = (seoData: ListingSeoData) => {
  const { title, description, address, propertyType, rent, bedrooms, bathrooms, squareFootage } = seoData;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    description,
    address,
    propertyType,
    offers: {
      '@type': 'Offer',
      price: rent,
      priceCurrency: 'USD',
    },
    numberOfBedrooms: bedrooms,
    numberOfBathroomsTotal: bathrooms,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: squareFootage,
      unitCode: 'FTK',
    },
  };

  return jsonLd;
};
