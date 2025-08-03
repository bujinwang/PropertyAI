# PropertyAI Image Upload System Guide

This document provides a comprehensive guide on how to use the PropertyAI image upload system for both the backend and frontend development teams.

## Table of Contents

1. [Overview](#overview)
2. [Backend Architecture](#backend-architecture)
3. [API Endpoints](#api-endpoints)
4. [Authentication & Authorization](#authentication--authorization)
5. [Frontend Implementation Guide](#frontend-implementation-guide)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

The PropertyAI image upload system provides functionality for:

- Uploading images for properties and units
- Managing (retrieving, updating, deleting) property and unit images
- Setting featured images for properties and units
- Handling image optimization and processing

The system is designed to work with both local storage (development) and AWS S3 storage (production), determined by environment configuration.

## Backend Architecture

The image upload system consists of several components:

1. **Storage Configuration** (`/config/storage.ts`):
   - Configures storage options (local or S3)
   - Provides file filters for security
   - Manages directories and file paths
   - Handles file deletion

2. **Image Service** (`/services/imageService.ts`):
   - `propertyImageService`: Manages property images
   - `unitImageService`: Manages unit images
   - `imageProcessingService`: Handles image optimization and processing

3. **Image Controller** (`/controllers/imageController.ts`):
   - Handles HTTP requests for image operations
   - Validates inputs
   - Formats responses

4. **Image Routes** (`/routes/imageRoutes.ts`):
   - Defines API endpoints
   - Configures middleware (auth, file uploads)

## API Endpoints

### Property Images

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|--------------|-------|
| `POST` | `/api/rentals/:propertyId/images` | Upload property images | Yes | ADMIN, PROPERTY_MANAGER |
| `GET` | `/api/rentals/:propertyId/images` | Get property images | Yes | Any |
| `DELETE` | `/api/rentals/images/:imageId` | Delete property image | Yes | ADMIN, PROPERTY_MANAGER |
| `PATCH` | `/api/rentals/:propertyId/images/:imageId/featured` | Set featured image | Yes | ADMIN, PROPERTY_MANAGER |

### Unit Images

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|--------------|-------|
| `POST` | `/api/rentals/:unitId/images` | Upload unit images | Yes | ADMIN, PROPERTY_MANAGER |
| `GET` | `/api/rentals/:unitId/images` | Get unit images | Yes | Any |
| `DELETE` | `/api/rentals/images/:imageId` | Delete unit image | Yes | ADMIN, PROPERTY_MANAGER |
| `PATCH` | `/api/rentals/:unitId/images/:imageId/featured` | Set featured image | Yes | ADMIN, PROPERTY_MANAGER |

## Authentication & Authorization

All image endpoints require authentication using JWT tokens. Most operations also require specific roles:

- `ADMIN`: Can perform all operations
- `PROPERTY_MANAGER`: Can upload, delete, and manage images for properties they manage
- All authenticated users: Can view images

The JWT token should be included in the `Authorization` header as a Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

## Frontend Implementation Guide

### Uploading Images

For React Native, use a library like `react-native-image-picker` to select images and `axios` to upload them:

```javascript
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const uploadPropertyImage = async (propertyId, setLoading) => {
  try {
    setLoading(true);
    
    // 1. Select image
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 5, // Allow multiple selection
    });
    
    if (result.didCancel || !result.assets) return;
    
    // 2. Create form data
    const formData = new FormData();
    
    result.assets.forEach(asset => {
      formData.append('images', {
        name: asset.fileName,
        type: asset.type,
        uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
      });
    });
    
    // 3. Get auth token
    const token = await AsyncStorage.getItem('authToken');
    
    // 4. Make API request
    const response = await axios.post(
      `${API_BASE_URL}/api/rentals/${propertyId}/images?featured=true`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    // 5. Handle success
    console.log('Images uploaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

### Retrieving Images

To retrieve property images:

```javascript
const getPropertyImages = async (propertyId, page = 1, limit = 20) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    const response = await axios.get(
      `${API_BASE_URL}/api/rentals/${propertyId}/images?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error getting property images:', error);
    throw error;
  }
};
```

### Displaying Images in a Carousel

```javascript
import React from 'react';
import { FlatList, Image, Dimensions, StyleSheet, View } from 'react-native';

const PropertyImageCarousel = ({ images }) => {
  const { width } = Dimensions.get('window');
  
  return (
    <FlatList
      data={images}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <Image
          source={{ uri: item.url }}
          style={[styles.image, { width }]}
          resizeMode="cover"
        />
      )}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    height: 250,
  },
});

export default PropertyImageCarousel;
```

## Best Practices

1. **Image Size Limits**:
   - The API enforces a 10MB limit per image
   - Optimize images on the client before uploading when possible

2. **Supported File Types**:
   - Images: JPEG, PNG, GIF, WebP
   - Documents (only for document uploads): PDF, DOCX, DOC, XLSX, XLS, TXT

3. **Security Considerations**:
   - Always validate file types
   - Never trust client-side validation
   - Use authenticated endpoints for all operations

4. **Performance**:
   - Use pagination for image listings
   - Request appropriate image sizes for different views
   - Consider using image caching libraries on the client

5. **Error Handling**:
   - Always handle upload errors gracefully
   - Provide feedback to users during long uploads
   - Implement retry logic for failed uploads

## Troubleshooting

### Common Issues and Solutions

1. **"No files uploaded" error**:
   - Ensure you're using the correct field name (`images`) in the FormData
   - Check the file format and size

2. **Authorization errors**:
   - Verify the JWT token is valid and not expired
   - Check that the user has the required role

3. **S3 Upload Issues**:
   - Verify AWS credentials are correctly set in environment variables
   - Check S3 bucket permissions

4. **Image Not Displaying**:
   - Verify the image URL is correct
   - Check if CORS is properly configured for S3
   - Ensure the image format is supported by the device

### Debugging

For backend debugging, check the server logs for detailed error messages. For frontend issues, implement proper error handling to display meaningful messages to users. 