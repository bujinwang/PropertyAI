"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWhiteLabelConfig = exports.updateWhiteLabelConfig = exports.createWhiteLabelConfig = exports.getWhiteLabelConfigByPropertyId = void 0;
const database_1 = require("../config/database");
const getWhiteLabelConfigByPropertyId = async (propertyId) => {
    return database_1.prisma.whiteLabelConfig.findUnique({
        where: { propertyId },
    });
};
exports.getWhiteLabelConfigByPropertyId = getWhiteLabelConfigByPropertyId;
const createWhiteLabelConfig = async (data) => {
    return database_1.prisma.whiteLabelConfig.create({
        data,
    });
};
exports.createWhiteLabelConfig = createWhiteLabelConfig;
const updateWhiteLabelConfig = async (id, data) => {
    return database_1.prisma.whiteLabelConfig.update({
        where: { id },
        data,
    });
};
exports.updateWhiteLabelConfig = updateWhiteLabelConfig;
const deleteWhiteLabelConfig = async (id) => {
    return database_1.prisma.whiteLabelConfig.delete({
        where: { id },
    });
};
exports.deleteWhiteLabelConfig = deleteWhiteLabelConfig;
//# sourceMappingURL=whiteLabel.service.js.map