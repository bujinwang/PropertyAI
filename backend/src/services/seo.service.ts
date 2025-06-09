import { propertyDescriptionService } from './propertyDescription.service';
import { photoEnhancementService } from './photoEnhancement.service';
import { keywordService } from './keyword.service';

class SeoService {
  async optimizeListing(propertyData: any, imageData: Buffer) {
    const description = await propertyDescriptionService.generateDescription(propertyData);
    const enhancedImage = await photoEnhancementService.enhancePhoto(imageData);
    const keywords = await keywordService.getKeywords(propertyData);

    const title = `${propertyData.bedrooms} bed apartment for rent in ${propertyData.location}`;
    const metaDescription = `Check out this amazing ${propertyData.bedrooms} bedroom apartment for rent in ${propertyData.location}. It has ${propertyData.amenities.join(', ')}.`;

    const seoData = {
      title: title,
      metaDescription: metaDescription,
      altText: `Image of ${propertyData.address}`,
      keywords: keywords,
      description: description,
      internalLinks: [
        {
          text: `More about ${propertyData.location}`,
          url: `/locations/${propertyData.location.toLowerCase().replace(' ', '-')}`,
        },
      ],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: propertyData.address,
        description: description,
        image: enhancedImage.toString('base64'),
        keywords: keywords.join(', '),
        url: `/listings/${propertyData.location.toLowerCase().replace(' ', '-')}/${propertyData.address.toLowerCase().replace(' ', '-')}`,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: propertyData.address,
          addressLocality: propertyData.city,
          addressRegion: propertyData.state,
          postalCode: propertyData.zipCode,
          addressCountry: 'US',
        },
      },
    };

    return seoData;
  }
}

export const seoService = new SeoService();
