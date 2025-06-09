"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromZillow = exports.updateOnZillow = exports.publishToZillow = void 0;
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const ZILLOW_API_URL = 'https://api.zillow.com/v1';
const getAuthHeaders = () => ({
    'Authorization': `Bearer ${process.env.ZILLOW_CLIENT_SECRET}`,
    'Content-Type': 'application/json',
});
const toZillowFormat = (listing) => {
    // This is a placeholder for the actual data mapping.
    // You would map your unified listing model to the Zillow API format here.
    return {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        // ... other fields
    };
};
const publishToZillow = async (listing) => {
    const response = await fetch(`${ZILLOW_API_URL}/listings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(toZillowFormat(listing)),
    });
    if (!response.ok) {
        throw new errorMiddleware_1.AppError('Failed to publish to Zillow', response.status);
    }
    return response.json();
};
exports.publishToZillow = publishToZillow;
const updateOnZillow = async (zillowListingId, listing) => {
    const response = await fetch(`${ZILLOW_API_URL}/listings/${zillowListingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(toZillowFormat(listing)),
    });
    if (!response.ok) {
        throw new errorMiddleware_1.AppError('Failed to update on Zillow', response.status);
    }
    return response.json();
};
exports.updateOnZillow = updateOnZillow;
const deleteFromZillow = async (zillowListingId) => {
    const response = await fetch(`${ZILLOW_API_URL}/listings/${zillowListingId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new errorMiddleware_1.AppError('Failed to delete from Zillow', response.status);
    }
    return response.json();
};
exports.deleteFromZillow = deleteFromZillow;
//# sourceMappingURL=zillowService.js.map