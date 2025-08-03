import { PrismaClient, Rental } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

class PricingService {
  /**
   * @deprecated Legacy method for Listing-based pricing. Use getRentalPriceRecommendation instead.
   */
  public async getPriceRecommendation(listing: any): Promise<any> {
    console.warn('PricingService.getPriceRecommendation is deprecated. Use getRentalPriceRecommendation instead.');
    
    // Fallback to rental-based pricing
    if (listing.rentalId) {
      const rental = await prisma.rental.findUnique({
        where: { id: listing.rentalId }
      });
      if (rental) {
        return this.getRentalPriceRecommendation(rental);
      }
    }

    // Legacy fallback
    const basePrice = listing.unit?.rent || listing.rent || 2000;
    const adjustmentFactor = 1.1; // 10% adjustment
    const recommendedPrice = basePrice * adjustmentFactor;

    return {
      recommendedPrice,
      explanation: 'Based on a simple adjustment of the current rent (legacy method).',
    };
  }

  /**
   * Get price recommendation for a rental
   * @param rental The rental object
   * @returns Price recommendation with analysis
   */
  public async getRentalPriceRecommendation(rental: Rental): Promise<any> {
    try {
      // Get market data for similar rentals in the area
      const similarRentals = await this.getSimilarRentals(rental);
      
      // Calculate base price from similar rentals
      const basePrice = this.calculateBasePrice(rental, similarRentals);
      
      // Apply adjustments based on rental features
      const adjustedPrice = this.applyFeatureAdjustments(rental, basePrice);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(similarRentals.length);
      
      return {
        recommendedPrice: Math.round(adjustedPrice),
        priceRange: {
          min: Math.round(adjustedPrice * 0.9),
          max: Math.round(adjustedPrice * 1.1)
        },
        marketAnalysis: this.generateMarketAnalysis(rental, similarRentals),
        confidence,
        comparableRentals: similarRentals.length,
        explanation: `Based on analysis of ${similarRentals.length} comparable rentals in the area.`
      };
    } catch (error) {
      console.error('Error generating rental price recommendation:', error);
      
      // Fallback to simple calculation
      const fallbackPrice = rental.rent || this.estimateBasePriceByType(rental);
      return {
        recommendedPrice: Math.round(fallbackPrice * 1.05),
        priceRange: {
          min: Math.round(fallbackPrice * 0.95),
          max: Math.round(fallbackPrice * 1.15)
        },
        marketAnalysis: 'Limited market data available. Recommendation based on property characteristics.',
        confidence: 'Low',
        comparableRentals: 0,
        explanation: 'Fallback pricing due to limited market data.'
      };
    }
  }

  /**
   * Find similar rentals in the area for comparison
   */
  private async getSimilarRentals(rental: Rental): Promise<Rental[]> {
    const similarRentals = await prisma.rental.findMany({
      where: {
        AND: [
          { id: { not: rental.id } }, // Exclude the current rental
          { city: rental.city },
          { state: rental.state },
          { propertyType: rental.propertyType },
          { isAvailable: true },
          {
            bedrooms: {
              gte: Math.max(1, (rental.bedrooms || 1) - 1),
              lte: (rental.bedrooms || 1) + 1
            }
          },
          {
            bathrooms: {
              gte: Math.max(1, (rental.bathrooms || 1) - 0.5),
              lte: (rental.bathrooms || 1) + 0.5
            }
          },
          {
            size: rental.size ? {
              gte: rental.size * 0.8,
              lte: rental.size * 1.2
            } : undefined
          }
        ].filter(Boolean)
      },
      take: 20,
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return similarRentals;
  }

  /**
   * Calculate base price from similar rentals
   */
  private calculateBasePrice(rental: Rental, similarRentals: Rental[]): number {
    if (similarRentals.length === 0) {
      return this.estimateBasePriceByType(rental);
    }

    // Calculate median price from similar rentals
    const prices = similarRentals
      .map(r => r.rent)
      .filter(price => price && price > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      return this.estimateBasePriceByType(rental);
    }

    const medianIndex = Math.floor(prices.length / 2);
    return prices.length % 2 === 0
      ? (prices[medianIndex - 1] + prices[medianIndex]) / 2
      : prices[medianIndex];
  }

  /**
   * Apply feature-based adjustments to the base price
   */
  private applyFeatureAdjustments(rental: Rental, basePrice: number): number {
    let adjustedPrice = basePrice;

    // Year built adjustment
    if (rental.yearBuilt) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - rental.yearBuilt;
      
      if (age < 5) {
        adjustedPrice *= 1.1; // 10% premium for new construction
      } else if (age > 30) {
        adjustedPrice *= 0.95; // 5% discount for older properties
      }
    }

    // Amenities adjustment
    if (rental.amenities && Array.isArray(rental.amenities)) {
      const premiumAmenities = ['pool', 'gym', 'parking', 'washerDryer', 'airConditioning'];
      const amenityCount = rental.amenities.filter(amenity => 
        premiumAmenities.includes(amenity)
      ).length;
      
      adjustedPrice *= (1 + (amenityCount * 0.02)); // 2% per premium amenity
    }

    // Size adjustment (if significantly different from average)
    if (rental.size && rental.bedrooms) {
      const avgSizePerBedroom = 600; // Rough estimate
      const expectedSize = rental.bedrooms * avgSizePerBedroom;
      const sizeRatio = rental.size / expectedSize;
      
      if (sizeRatio > 1.2) {
        adjustedPrice *= 1.05; // 5% premium for larger units
      } else if (sizeRatio < 0.8) {
        adjustedPrice *= 0.95; // 5% discount for smaller units
      }
    }

    return adjustedPrice;
  }

  /**
   * Calculate confidence score based on available data
   */
  private calculateConfidence(comparableCount: number): string {
    if (comparableCount >= 10) return 'High';
    if (comparableCount >= 5) return 'Medium';
    if (comparableCount >= 2) return 'Low';
    return 'Very Low';
  }

  /**
   * Generate market analysis text
   */
  private generateMarketAnalysis(rental: Rental, similarRentals: Rental[]): string {
    if (similarRentals.length === 0) {
      return `Limited market data available for ${rental.propertyType.toLowerCase()}s in ${rental.city}, ${rental.state}.`;
    }

    const avgPrice = similarRentals.reduce((sum, r) => sum + (r.rent || 0), 0) / similarRentals.length;
    const currentPrice = rental.rent || 0;
    
    let analysis = `Based on ${similarRentals.length} comparable ${rental.propertyType.toLowerCase()}s in ${rental.city}, ${rental.state}. `;
    
    if (currentPrice > avgPrice * 1.1) {
      analysis += 'Current pricing is above market average.';
    } else if (currentPrice < avgPrice * 0.9) {
      analysis += 'Current pricing is below market average.';
    } else {
      analysis += 'Current pricing is in line with market average.';
    }

    return analysis;
  }

  /**
   * Estimate base price by property type when no comparables are available
   */
  private estimateBasePriceByType(rental: Rental): number {
    const basePrices: Record<string, number> = {
      'APARTMENT': 1500,
      'HOUSE': 2000,
      'CONDO': 1800,
      'TOWNHOUSE': 1900,
      'COMMERCIAL': 3000,
      'OTHER': 1600
    };

    let basePrice = basePrices[rental.propertyType] || 1600;
    
    // Adjust by bedroom count
    if (rental.bedrooms) {
      basePrice *= (0.7 + (rental.bedrooms * 0.3));
    }

    return basePrice;
  }

  /**
   * Get market trends for a specific area
   */
  public async getMarketTrends(city: string, state: string, propertyType?: string): Promise<any> {
    try {
      const whereClause: any = {
        city,
        state,
        isAvailable: true
      };

      if (propertyType) {
        whereClause.propertyType = propertyType;
      }

      const rentals = await prisma.rental.findMany({
        where: whereClause,
        select: {
          rent: true,
          bedrooms: true,
          propertyType: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      });

      if (rentals.length === 0) {
        return {
          averageRent: 0,
          medianRent: 0,
          totalListings: 0,
          priceRange: { min: 0, max: 0 },
          message: 'No market data available for this area.'
        };
      }

      const rents = rentals.map(r => r.rent).filter(rent => rent && rent > 0);
      const averageRent = rents.reduce((sum, rent) => sum + rent, 0) / rents.length;
      
      const sortedRents = rents.sort((a, b) => a - b);
      const medianRent = sortedRents.length % 2 === 0
        ? (sortedRents[sortedRents.length / 2 - 1] + sortedRents[sortedRents.length / 2]) / 2
        : sortedRents[Math.floor(sortedRents.length / 2)];

      return {
        averageRent: Math.round(averageRent),
        medianRent: Math.round(medianRent),
        totalListings: rentals.length,
        priceRange: {
          min: Math.min(...rents),
          max: Math.max(...rents)
        },
        byPropertyType: this.groupByPropertyType(rentals)
      };
    } catch (error) {
      console.error('Error getting market trends:', error);
      throw new AppError('Failed to retrieve market trends', 500);
    }
  }

  /**
   * Group rentals by property type for market analysis
   */
  private groupByPropertyType(rentals: any[]): Record<string, any> {
    const grouped = rentals.reduce((acc, rental) => {
      const type = rental.propertyType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(rental.rent);
      return acc;
    }, {} as Record<string, number[]>);

    const result: Record<string, any> = {};
    
    Object.entries(grouped).forEach(([type, rents]) => {
      const validRents = rents.filter(rent => rent && rent > 0);
      if (validRents.length > 0) {
        const avg = validRents.reduce((sum, rent) => sum + rent, 0) / validRents.length;
        result[type] = {
          averageRent: Math.round(avg),
          count: validRents.length
        };
      }
    });

    return result;
  }
}

export default new PricingService();
