"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromApartmentsCom = exports.publishToApartmentsCom = void 0;
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const jstoxml_1 = require("jstoxml");
const APARTMENTS_COM_API_URL = 'https://api.apartments.com/v1';
const getAuthHeaders = () => ({
    'Authorization': `Bearer ${process.env.APARTMENTS_COM_API_KEY}`,
    'Content-Type': 'application/xml',
});
const toApartmentsComFormat = (listing) => {
    // This is a placeholder for the actual data mapping.
    // You would map your unified listing model to the Apartments.com XML format here.
    return (0, jstoxml_1.toXML)({
        listing: {
            title: listing.title,
            description: listing.description,
            price: listing.price,
            // ... other fields
        },
    });
};
const publishToApartmentsCom = async (listing) => {
    const response = await fetch(`${APARTMENTS_COM_API_URL}/import`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: toApartmentsComFormat(listing),
    });
    if (!response.ok) {
        throw new errorMiddleware_1.AppError('Failed to publish to Apartments.com', response.status);
    }
    return response.text();
};
exports.publishToApartmentsCom = publishToApartmentsCom;
const deleteFromApartmentsCom = async (listingId) => {
    const response = await fetch(`${APARTMENTS_COM_API_URL}/delete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: (0, jstoxml_1.toXML)({ listingId }),
    });
    if (!response.ok) {
        throw new errorMiddleware_1.AppError('Failed to delete from Apartments.com', response.status);
    }
    return response.text();
};
exports.deleteFromApartmentsCom = deleteFromApartmentsCom;
//# sourceMappingURL=apartmentsComService.js.map