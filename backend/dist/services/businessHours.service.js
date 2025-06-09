"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBusinessHours = exports.updateBusinessHours = exports.createBusinessHours = exports.getBusinessHoursByPropertyId = void 0;
const database_1 = require("../config/database");
const getBusinessHoursByPropertyId = async (propertyId) => {
    return database_1.prisma.businessHours.findMany({
        where: { propertyId },
    });
};
exports.getBusinessHoursByPropertyId = getBusinessHoursByPropertyId;
const createBusinessHours = async (data) => {
    return database_1.prisma.businessHours.create({
        data,
    });
};
exports.createBusinessHours = createBusinessHours;
const updateBusinessHours = async (id, data) => {
    return database_1.prisma.businessHours.update({
        where: { id },
        data,
    });
};
exports.updateBusinessHours = updateBusinessHours;
const deleteBusinessHours = async (id) => {
    return database_1.prisma.businessHours.delete({
        where: { id },
    });
};
exports.deleteBusinessHours = deleteBusinessHours;
//# sourceMappingURL=businessHours.service.js.map