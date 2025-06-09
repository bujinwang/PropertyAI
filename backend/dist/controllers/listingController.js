"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbManager_1 = require("../utils/dbManager");
class ListingController {
    async getAllListings(req, res) {
        try {
            const listings = await dbManager_1.prisma.listing.findMany();
            res.status(200).json(listings);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createListing(req, res) {
        try {
            const listing = await dbManager_1.prisma.listing.create({ data: req.body });
            res.status(201).json(listing);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getListingById(req, res) {
        try {
            const listing = await dbManager_1.prisma.listing.findUnique({
                where: { id: req.params.id },
            });
            if (listing) {
                res.status(200).json(listing);
            }
            else {
                res.status(404).json({ message: 'Listing not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateListing(req, res) {
        try {
            const listing = await dbManager_1.prisma.listing.update({
                where: { id: req.params.id },
                data: req.body,
            });
            res.status(200).json(listing);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteListing(req, res) {
        try {
            await dbManager_1.prisma.listing.delete({ where: { id: req.params.id } });
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new ListingController();
//# sourceMappingURL=listingController.js.map