import { PrismaClient, Listing, Property, Unit } from '@prisma/client';
import aiService from './aiService';

const prisma = new PrismaClient();

export const listingService = {
  async create(data: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>, authorId: string): Promise<Listing> {
    return prisma.listing.create({
      data: {
        ...data,
        authorId,
      },
    });
  },

  async findAll(): Promise<Listing[]> {
    return prisma.listing.findMany();
  },

  async findById(id: string): Promise<Listing | null> {
    return prisma.listing.findUnique({
      where: { id },
    });
  },

  async update(id: string, data: Partial<Listing>): Promise<Listing> {
    return prisma.listing.update({
      where: { id },
      data,
    });
  },

  async remove(id: string): Promise<Listing> {
    return prisma.listing.delete({
      where: { id },
    });
  },

  async generateDescription(listingId: string): Promise<string> {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        property: true,
        unit: true,
      },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    return aiService.generateListingDescription(listing as Listing & { property: Property; unit: Unit });
  },

  async generatePriceRecommendation(listingId: string): Promise<{ recommendedPrice: number; explanation: string }> {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        property: true,
        unit: true,
      },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    return aiService.generatePriceRecommendation(listing as Listing & { property: Property; unit: Unit });
  }
};

export default listingService;