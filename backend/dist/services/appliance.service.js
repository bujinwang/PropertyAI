"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAppliance = exports.updateAppliance = exports.getApplianceById = exports.createAppliance = exports.getAppliancesByUnitId = void 0;
const database_1 = require("../config/database");
const getAppliancesByUnitId = async (unitId) => {
    return database_1.prisma.appliance.findMany({
        where: { unitId },
    });
};
exports.getAppliancesByUnitId = getAppliancesByUnitId;
const createAppliance = async (data) => {
    return database_1.prisma.appliance.create({
        data,
    });
};
exports.createAppliance = createAppliance;
const getApplianceById = async (id) => {
    return database_1.prisma.appliance.findUnique({
        where: { id },
    });
};
exports.getApplianceById = getApplianceById;
const updateAppliance = async (id, data) => {
    return database_1.prisma.appliance.update({
        where: { id },
        data,
    });
};
exports.updateAppliance = updateAppliance;
const deleteAppliance = async (id) => {
    return database_1.prisma.appliance.delete({
        where: { id },
    });
};
exports.deleteAppliance = deleteAppliance;
//# sourceMappingURL=appliance.service.js.map