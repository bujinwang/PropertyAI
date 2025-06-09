"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbManager_1 = require("../utils/dbManager");
const cache_1 = require("../utils/cache");
class PropertyController {
    async getAllProperties(req, res) {
        const { skip, take } = req.query;
        const cacheKey = `properties-skip:${skip}-take:${take}`;
        const cachedProperties = (0, cache_1.getCache)(cacheKey);
        if (cachedProperties) {
            return res.status(200).json(cachedProperties);
        }
        try {
            const properties = await dbManager_1.prisma.property.findMany({
                skip: skip ? parseInt(skip) : undefined,
                take: take ? parseInt(take) : undefined,
            });
            (0, cache_1.setCache)(cacheKey, properties, 300000);
            res.status(200).json(properties);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createProperty(req, res) {
        try {
            const property = await dbManager_1.prisma.property.create({ data: req.body });
            (0, cache_1.clearCache)('properties-skip:undefined-take:undefined');
            res.status(201).json(property);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getPropertyById(req, res) {
        const cacheKey = `property-${req.params.id}`;
        const cachedProperty = (0, cache_1.getCache)(cacheKey);
        if (cachedProperty) {
            return res.status(200).json(cachedProperty);
        }
        try {
            const property = await dbManager_1.prisma.property.findUnique({
                where: { id: req.params.id },
            });
            if (property) {
                (0, cache_1.setCache)(cacheKey, property, 300000);
                res.status(200).json(property);
            }
            else {
                res.status(404).json({ message: 'Property not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateProperty(req, res) {
        try {
            const property = await dbManager_1.prisma.property.update({
                where: { id: req.params.id },
                data: req.body,
            });
            (0, cache_1.clearCache)(`property-${req.params.id}`);
            (0, cache_1.clearCache)('properties-skip:undefined-take:undefined');
            res.status(200).json(property);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteProperty(req, res) {
        try {
            await dbManager_1.prisma.property.delete({ where: { id: req.params.id } });
            (0, cache_1.clearCache)(`property-${req.params.id}`);
            (0, cache_1.clearCache)('properties-skip:undefined-take:undefined');
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new PropertyController();
//# sourceMappingURL=propertyController.js.map