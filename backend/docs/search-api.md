# PropertyAI Search API Documentation

This document provides comprehensive documentation for the PropertyAI search and filtering API endpoints.

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Search Properties Endpoint](#search-properties-endpoint)
5. [Search Units Endpoint](#search-units-endpoint)
6. [Property Types Endpoint](#property-types-endpoint)
7. [Search Parameters Reference](#search-parameters-reference)
8. [Example Requests](#example-requests)
9. [Error Handling](#error-handling)

## Overview

The PropertyAI Search API provides advanced search and filtering capabilities for properties and units. It supports multiple filtering options, full-text search, geolocation-based proximity search, sorting, and pagination.

## Base URL

All API requests should be prefixed with:

```
http://localhost:3000/api
```

In production, replace with your domain.

## Authentication

Most search endpoints are publicly accessible, but some specialized filters may require authentication.

## Search Properties Endpoint

This endpoint allows searching for properties with multiple filtering criteria.

### Request

```
GET /search/properties
```

### Query Parameters

| Parameter       | Type     | Description                                      | Example                     |
|----------------|----------|--------------------------------------------------|----------------------------|
| query          | string   | Full-text search term across name, description, address | "downtown luxury"       |
| propertyType   | string   | Property type (see Property Types endpoint)       | "APARTMENT"                |
| city           | string   | Filter by city                                   | "San Francisco"            |
| state          | string   | Filter by state                                  | "CA"                       |
| zipCode        | string   | Filter by ZIP code                               | "94105"                    |
| minRent        | number   | Minimum rent                                     | 1500                       |
| maxRent        | number   | Maximum rent                                     | 3000                       |
| bedrooms       | number   | Minimum number of bedrooms                        | 2                          |
| bathrooms      | number   | Minimum number of bathrooms                       | 1.5                        |
| minSize        | number   | Minimum square footage                           | 700                        |
| maxSize        | number   | Maximum square footage                           | 1500                       |
| isAvailable    | boolean  | Only show properties with available units         | true                       |
| availableFrom  | date     | Available from date (ISO 8601)                   | "2023-12-01"               |
| amenities      | string[] | Required amenities                               | ["pool","gym"]             |
| latitude       | number   | Center latitude for proximity search              | 37.7749                    |
| longitude      | number   | Center longitude for proximity search             | -122.4194                  |
| radius         | number   | Search radius in miles                           | 5                          |
| managerId      | string   | Filter by property manager ID                     | "manager-uuid"             |
| ownerId        | string   | Filter by owner ID                               | "owner-uuid"               |
| isActive       | boolean  | Include inactive properties                       | false                      |
| sortField      | string   | Field to sort by                                 | "createdAt", "price"       |
| sortOrder      | string   | Sort direction                                   | "asc" or "desc"            |
| page           | number   | Page number (1-based)                            | 1                          |
| limit          | number   | Items per page                                   | 10                         |

### Response

```json
{
  "status": "success",
  "data": {
    "properties": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Luxury Downtown Apartments",
        "address": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94105",
        "description": "Luxury apartments in downtown with amazing views",
        "propertyType": "APARTMENT",
        "totalUnits": 50,
        "amenities": ["pool", "gym", "doorman"],
        "manager": {
          "id": "789e4567-e89b-12d3-a456-426614174000",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "units": [
          {
            "id": "456e4567-e89b-12d3-a456-426614174000",
            "unitNumber": "101",
            "bedrooms": 2,
            "bathrooms": 2,
            "size": 950,
            "rent": 2500,
            "isAvailable": true
          }
        ],
        "images": [
          {
            "id": 1,
            "url": "https://example.com/image1.jpg",
            "isFeatured": true
          }
        ]
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

## Search Units Endpoint

This endpoint allows searching for available units with multiple filtering criteria.

### Request

```
GET /search/units
```

### Query Parameters

| Parameter      | Type     | Description                                | Example               |
|---------------|----------|--------------------------------------------|-----------------------|
| propertyId     | string   | Filter by property ID                       | "property-uuid"       |
| bedrooms       | number   | Minimum number of bedrooms                  | 2                     |
| bathrooms      | number   | Minimum number of bathrooms                 | 1.5                   |
| minRent        | number   | Minimum rent                               | 1500                  |
| maxRent        | number   | Maximum rent                               | 3000                  |
| minSize        | number   | Minimum square footage                     | 700                   |
| maxSize        | number   | Maximum square footage                     | 1500                  |
| availableFrom  | date     | Available from date (ISO 8601)             | "2023-12-01"          |
| sortField      | string   | Field to sort by                           | "rent", "size"        |
| sortOrder      | string   | Sort direction                             | "asc" or "desc"       |
| page           | number   | Page number (1-based)                      | 1                     |
| limit          | number   | Items per page                             | 10                    |

### Response

```json
{
  "status": "success",
  "data": {
    "units": [
      {
        "id": "456e4567-e89b-12d3-a456-426614174000",
        "unitNumber": "101",
        "bedrooms": 2,
        "bathrooms": 2,
        "size": 950,
        "rent": 2500,
        "isAvailable": true,
        "dateAvailable": "2023-12-01T00:00:00.000Z",
        "property": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "name": "Luxury Downtown Apartments",
          "address": "123 Main St",
          "city": "San Francisco",
          "state": "CA",
          "zipCode": "94105"
        },
        "images": [
          {
            "id": 5,
            "url": "https://example.com/unit-image1.jpg",
            "isFeatured": true
          }
        ]
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

## Property Types Endpoint

Returns all available property types.

### Request

```
GET /search/property-types
```

### Response

```json
{
  "status": "success",
  "data": [
    "APARTMENT",
    "HOUSE",
    "CONDO",
    "TOWNHOUSE",
    "COMMERCIAL",
    "INDUSTRIAL",
    "OTHER"
  ]
}
```

## Search Parameters Reference

### Property Type Values

The API accepts the following property types:

- `APARTMENT`: Multi-unit residential buildings
- `HOUSE`: Single-family homes
- `CONDO`: Individually owned units in a larger building
- `TOWNHOUSE`: Row houses with shared walls
- `COMMERCIAL`: Properties for business use
- `INDUSTRIAL`: Manufacturing and warehouse properties
- `OTHER`: Any other property type

### Amenities

Common amenities that can be used for filtering:

- `pool`: Swimming pool
- `gym`: Fitness center
- `doorman`: Doorman service
- `elevator`: Elevator access
- `parking`: Parking available
- `laundry`: Laundry facilities
- `airConditioning`: Air conditioning
- `petsAllowed`: Pets allowed
- `balcony`: Private balcony
- `storage`: Storage space

## Example Requests

### Basic Search

```
GET /api/search/properties?city=San Francisco&bedrooms=2&minRent=1500&maxRent=3000
```

### Advanced Search with Proximity

```
GET /api/search/properties?latitude=37.7749&longitude=-122.4194&radius=2&amenities=pool&amenities=gym&sortField=distance&sortOrder=asc
```

### Search for Available Units

```
GET /api/search/units?bedrooms=2&bathrooms=1.5&minRent=1800&maxRent=2500&availableFrom=2023-12-01
```

## Error Handling

The API returns standard HTTP status codes along with detailed error messages:

### Common Error Codes

- `400 Bad Request`: Invalid parameters or missing required fields
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

### Error Response Format

```json
{
  "status": "error",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
``` 