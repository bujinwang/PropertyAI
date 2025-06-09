"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJsonLd = exports.generateMetaTags = exports.generateSlug = exports.prepareListingSeoData = void 0;
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const prepareListingSeoData = (listing) => {
    if (!listing) {
        throw new errorMiddleware_1.AppError('Listing not found', 404);
    }
    return {
        title: listing.title,
        description: listing.description,
        address: `${listing.property.address}, ${listing.property.city}, ${listing.property.state} ${listing.property.zipCode}`,
        propertyType: listing.property.propertyType,
        price: listing.price,
        bedrooms: listing.unit.bedrooms,
        bathrooms: listing.unit.bathrooms,
        squareFootage: listing.unit.size,
        amenities: listing.property.amenities,
    };
};
exports.prepareListingSeoData = prepareListingSeoData;
const generateSlug = async (title, city, propertyType) => {
    const slugify = (text) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    let slug = slugify(`${propertyType}-in-${city}-${title}`);
    // ensure uniqueness
    const prisma = new (await Promise.resolve().then(() => __importStar(require('@prisma/client')))).PrismaClient();
    let uniqueSlug = slug;
    let counter = 1;
    while (await prisma.listing.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }
    return uniqueSlug;
};
exports.generateSlug = generateSlug;
const generateMetaTags = (seoData) => {
    const { title, description, propertyType, address } = seoData;
    const metaTitle = `${propertyType} in ${address} - ${title} | PropertyAI`;
    const metaDescription = description.substring(0, 160);
    return { metaTitle, metaDescription };
};
exports.generateMetaTags = generateMetaTags;
const generateJsonLd = (seoData) => {
    const { title, description, address, propertyType, price, bedrooms, bathrooms, squareFootage } = seoData;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: title,
        description,
        address,
        propertyType,
        offers: {
            '@type': 'Offer',
            price,
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
exports.generateJsonLd = generateJsonLd;
//# sourceMappingURL=seoService.js.map