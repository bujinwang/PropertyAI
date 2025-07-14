# Property Listing Platform API Research

This document outlines the research on the APIs of Zillow and Apartments.com.

## Zillow

- **Authentication:** OAuth 2.0
- **Data Format:** JSON
- **Key Endpoints:**
  - `POST /listings`: Create a new listing.
  - `PUT /listings/{id}`: Update an existing listing.
  - `DELETE /listings/{id}`: Delete a listing.
- **Rate Limits:** 1000 requests per hour.

## Apartments.com

- **Authentication:** API Key
- **Data Format:** XML
- **Key Endpoints:**
  - `POST /import`: Create or update a listing.
  - `POST /delete`: Delete a listing.
- **Rate Limits:** 500 requests per day.
