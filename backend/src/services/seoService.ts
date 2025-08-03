import { Rental } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';

interface RentalSeoData {
  title: string;
  description: string;
  address: string;
  propertyType: string;
  rent: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFootage?: number | null;
  amenities?: any;
}

export const prepareRentalSeoData = (rental: Rental): RentalSeoData => {
  if (!rental) {
    throw new AppError('Rental not found', 404);
  }

  return {
    title: rental.title,
    description: rental.description || '',
    address: `${rental.address}, ${rental.city}, ${rental.state} ${rental.zipCode}`,
    propertyType: rental.propertyType,
    rent: rental.rent,
    bedrooms: rental.bedrooms,
    bathrooms: rental.bathrooms,
    squareFootage: rental.size,
    amenities: rental.amenities,
  };
};

// Legacy function for backward compatibility
export const prepareListingSeoData = prepareRentalSeoData;

export const generateSlug = async (title: string, city: string, propertyType: string): Promise<string> => {
  const slugify = (text: string) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  let slug = slugify(`${propertyType}-in-${city}-${title}`);
  
  // ensure uniqueness - only check rental table now
  const prisma = new (await import('@prisma/client')).PrismaClient();
  let uniqueSlug = slug;
  let counter = 1;
  
  while (await prisma.rental.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
};

export const generateMetaTags = (seoData: RentalSeoData) => {
  const { title, description, propertyType, address } = seoData;
  const metaTitle = `${propertyType} in ${address} - ${title} | PropertyAI`;
  const metaDescription = description.substring(0, 160);
  return { metaTitle, metaDescription };
};

export const generateJsonLd = (seoData: RentalSeoData) => {
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

// Type alias for backward compatibility
export type ListingSeoData = RentalSeoData;
