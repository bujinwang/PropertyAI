import { Client, GeocodeRequest, GeocodeResponse, ReverseGeocodeRequest, PlaceDetailsRequest } from '@googlemaps/google-maps-services-js';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/config';

const prisma = new PrismaClient();
const client = new Client({});

interface GeocodeResult {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId: string;
  components: {
    streetNumber?: string;
    route?: string;
    neighborhood?: string;
    locality?: string; // City
    administrativeAreaLevel1?: string; // State
    administrativeAreaLevel2?: string; // County
    country?: string;
    postalCode?: string;
  };
  success: boolean;
  message?: string;
}

/**
 * Geocodes an address string to retrieve coordinate information
 * @param address Full address string to geocode
 * @returns Geocoding result with coordinates and formatted address
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    // Prepare request options for the Google Maps API
    const request: GeocodeRequest = {
      params: {
        address,
        key: config.googleMapsApiKey,
      },
    };

    // Call the geocoding API
    const response = await client.geocode(request);

    // Check if we got valid results
    if (response.data.status !== 'OK' || response.data.results.length === 0) {
      return {
        formattedAddress: '',
        latitude: 0,
        longitude: 0,
        placeId: '',
        components: {},
        success: false,
        message: `Geocoding failed with status: ${response.data.status}`,
      };
    }

    // Extract the first (most relevant) result
    const result = response.data.results[0];
    const location = result.geometry.location;
    
    // Parse address components
    const components = parseAddressComponents(result.address_components);

    return {
      formattedAddress: result.formatted_address,
      latitude: location.lat,
      longitude: location.lng,
      placeId: result.place_id,
      components,
      success: true,
    };
  } catch (error) {
    console.error('Error in geocodeAddress:', error);
    return {
      formattedAddress: '',
      latitude: 0,
      longitude: 0,
      placeId: '',
      components: {},
      success: false,
      message: error instanceof Error ? error.message : 'Unknown geocoding error',
    };
  }
}

/**
 * Performs reverse geocoding to get an address from coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Geocoding result with address information
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
  try {
    // Prepare request options
    const request: ReverseGeocodeRequest = {
      params: {
        latlng: { lat: latitude, lng: longitude },
        key: config.googleMapsApiKey,
      },
    };

    // Call the reverse geocoding API
    const response = await client.reverseGeocode(request);

    // Check if we got valid results
    if (response.data.status !== 'OK' || response.data.results.length === 0) {
      return {
        formattedAddress: '',
        latitude,
        longitude,
        placeId: '',
        components: {},
        success: false,
        message: `Reverse geocoding failed with status: ${response.data.status}`,
      };
    }

    // Extract the first (most relevant) result
    const result = response.data.results[0];
    
    // Parse address components
    const components = parseAddressComponents(result.address_components);

    return {
      formattedAddress: result.formatted_address,
      latitude,
      longitude,
      placeId: result.place_id,
      components,
      success: true,
    };
  } catch (error) {
    console.error('Error in reverseGeocode:', error);
    return {
      formattedAddress: '',
      latitude,
      longitude,
      placeId: '',
      components: {},
      success: false,
      message: error instanceof Error ? error.message : 'Unknown reverse geocoding error',
    };
  }
}

/**
 * Validates an address by attempting to geocode it and checking the result quality
 * @param address Address to validate
 * @returns Validation result with normalized address if successful
 */
export async function validateAddress(address: string): Promise<{
  isValid: boolean;
  normalizedAddress?: string;
  message?: string;
  geocodeResult?: GeocodeResult;
}> {
  try {
    // Attempt to geocode the address
    const geocodeResult = await geocodeAddress(address);

    if (!geocodeResult.success) {
      return {
        isValid: false,
        message: geocodeResult.message || 'Address could not be geocoded',
      };
    }

    // Check if we have the minimum required components for a valid address
    const { components } = geocodeResult;
    const requiredComponents = ['route', 'locality', 'administrativeAreaLevel1', 'country'];
    
    const missingComponents = requiredComponents.filter(
      comp => !components[comp as keyof typeof components]
    );

    if (missingComponents.length > 0) {
      return {
        isValid: false,
        message: `Missing address components: ${missingComponents.join(', ')}`,
        geocodeResult,
      };
    }

    return {
      isValid: true,
      normalizedAddress: geocodeResult.formattedAddress,
      geocodeResult,
    };
  } catch (error) {
    console.error('Error in validateAddress:', error);
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Unknown address validation error',
    };
  }
}

/**
 * Updates a property's geolocation data in the database
 * @param propertyId ID of the property to update
 * @param geocodeResult Geocoding result data
 * @returns Updated property
 */
export async function updatePropertyGeolocation(
  propertyId: string,
  geocodeResult: GeocodeResult
) {
  try {
    // Update the property with geocode information
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        address: geocodeResult.formattedAddress,
        // Update address components from the geocode result
        ...(geocodeResult.components.locality && { city: geocodeResult.components.locality }),
        ...(geocodeResult.components.administrativeAreaLevel1 && { 
          state: geocodeResult.components.administrativeAreaLevel1 
        }),
        ...(geocodeResult.components.postalCode && { zipCode: geocodeResult.components.postalCode }),
        ...(geocodeResult.components.country && { country: geocodeResult.components.country }),
      },
    });

    return updatedProperty;
  } catch (error) {
    console.error('Error in updatePropertyGeolocation:', error);
    throw error;
  }
}

/**
 * Gets nearby places of a specific type around a location
 * @param latitude Latitude of the center point
 * @param longitude Longitude of the center point
 * @param radius Radius in meters to search
 * @param type Type of place to search for
 * @returns Array of nearby places
 */
export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
  radius: number = 1000,
  type: string = 'restaurant'
) {
  try {
    // This requires the Places API which is a separate service
    // Implementation would depend on your specific needs
    // For now, we'll return a placeholder
    return {
      success: false,
      message: 'Nearby places functionality requires Google Places API implementation',
    };
  } catch (error) {
    console.error('Error in getNearbyPlaces:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error getting nearby places',
    };
  }
}

/**
 * Helper function to parse address components from Google Geocoding API response
 */
function parseAddressComponents(addressComponents: any[]) {
  const components: Record<string, string> = {};
  
  // Map of Google's address component types to our simplified component names
  const componentTypeMap: Record<string, string> = {
    'street_number': 'streetNumber',
    'route': 'route',
    'neighborhood': 'neighborhood',
    'sublocality': 'neighborhood',
    'locality': 'locality',
    'administrative_area_level_1': 'administrativeAreaLevel1',
    'administrative_area_level_2': 'administrativeAreaLevel2',
    'country': 'country',
    'postal_code': 'postalCode',
  };

  // Extract components we care about
  addressComponents.forEach(component => {
    component.types.forEach((type: string) => {
      if (componentTypeMap[type]) {
        components[componentTypeMap[type]] = component.long_name;
      }
    });
  });

  return components;
} 