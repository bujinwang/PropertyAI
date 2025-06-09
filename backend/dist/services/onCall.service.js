"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOnCallRotation = exports.updateOnCallRotation = exports.createOnCallRotation = exports.deleteOnCallSchedule = exports.updateOnCallSchedule = exports.createOnCallSchedule = exports.getOnCallSchedulesByPropertyId = void 0;
const database_1 = require("../config/database");
const getOnCallSchedulesByPropertyId = async (propertyId) => {
    return database_1.prisma.onCallSchedule.findMany({
        where: { propertyId },
        include: { rotations: true },
    });
};
exports.getOnCallSchedulesByPropertyId = getOnCallSchedulesByPropertyId;
const createOnCallSchedule = async (data) => {
    return database_1.prisma.onCallSchedule.create({
        data,
    });
};
exports.createOnCallSchedule = createOnCallSchedule;
const updateOnCallSchedule = async (id, data) => {
    return database_1.prisma.onCallSchedule.update({
        where: { id },
        data,
    });
};
exports.updateOnCallSchedule = updateOnCallSchedule;
const deleteOnCallSchedule = async (id) => {
    return database_1.prisma.onCallSchedule.delete({
        where: { id },
    });
};
exports.deleteOnCallSchedule = deleteOnCallSchedule;
const createOnCallRotation = async (data) => {
    return database_1.prisma.onCallRotation.create({
        data,
    });
};
exports.createOnCallRotation = createOnCallRotation;
const updateOnCallRotation = async (id, data) => {
    return database_1.prisma.onCallRotation.update({
        where: { id },
        data,
    });
};
exports.updateOnCallRotation = updateOnCallRotation;
const deleteOnCallRotation = async (id) => {
    return database_1.prisma.onCallRotation.delete({
        where: { id },
    });
};
exports.deleteOnCallRotation = deleteOnCallRotation;
//# sourceMappingURL=onCall.service.js.map