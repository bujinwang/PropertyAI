"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listingService = void 0;
const client_1 = require("@prisma/client");
const aiService_1 = require("./aiService");
const prisma = new client_1.PrismaClient();
exports.listingService = {
    async create(data, authorId) {
        return prisma.listing.create({
            data: {
                ...data,
                authorId,
            },
        });
    },
    async findAll() {
        return prisma.listing.findMany();
    },
    async findById(id) {
        return prisma.listing.findUnique({
            where: { id },
        });
    },
    async update(id, data) {
        return prisma.listing.update({
            where: { id },
            data,
        });
    },
    async remove(id) {
        return prisma.listing.delete({
            where: { id },
        });
    },
    async generateDescription(listingId) {
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
        return aiService_1.aiService.generateListingDescription(listing);
    },
    async generatePriceRecommendation(listingId) {
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
        return aiService_1.aiService.generatePriceRecommendation(listing);
    }
};
exports.default = exports.listingService;
//# sourceMappingURL=listingService.js.map