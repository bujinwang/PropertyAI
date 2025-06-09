"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmergencyProtocol = exports.updateEmergencyProtocol = exports.createEmergencyProtocol = exports.getEmergencyProtocolsByPropertyId = void 0;
const database_1 = require("../config/database");
const getEmergencyProtocolsByPropertyId = async (propertyId) => {
    return database_1.prisma.emergencyProtocol.findMany({
        where: { propertyId },
    });
};
exports.getEmergencyProtocolsByPropertyId = getEmergencyProtocolsByPropertyId;
const createEmergencyProtocol = async (data) => {
    return database_1.prisma.emergencyProtocol.create({
        data,
    });
};
exports.createEmergencyProtocol = createEmergencyProtocol;
const updateEmergencyProtocol = async (id, data) => {
    return database_1.prisma.emergencyProtocol.update({
        where: { id },
        data,
    });
};
exports.updateEmergencyProtocol = updateEmergencyProtocol;
const deleteEmergencyProtocol = async (id) => {
    return database_1.prisma.emergencyProtocol.delete({
        where: { id },
    });
};
exports.deleteEmergencyProtocol = deleteEmergencyProtocol;
//# sourceMappingURL=emergencyProtocol.service.js.map