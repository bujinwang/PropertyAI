"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEscalationPolicyRule = exports.updateEscalationPolicyRule = exports.createEscalationPolicyRule = exports.deleteEscalationPolicy = exports.updateEscalationPolicy = exports.createEscalationPolicy = exports.getEscalationPoliciesByPropertyId = void 0;
const database_1 = require("../config/database");
const getEscalationPoliciesByPropertyId = async (propertyId) => {
    return database_1.prisma.escalationPolicy.findMany({
        where: { propertyId },
        include: { rules: true },
    });
};
exports.getEscalationPoliciesByPropertyId = getEscalationPoliciesByPropertyId;
const createEscalationPolicy = async (data) => {
    return database_1.prisma.escalationPolicy.create({
        data,
    });
};
exports.createEscalationPolicy = createEscalationPolicy;
const updateEscalationPolicy = async (id, data) => {
    return database_1.prisma.escalationPolicy.update({
        where: { id },
        data,
    });
};
exports.updateEscalationPolicy = updateEscalationPolicy;
const deleteEscalationPolicy = async (id) => {
    return database_1.prisma.escalationPolicy.delete({
        where: { id },
    });
};
exports.deleteEscalationPolicy = deleteEscalationPolicy;
const createEscalationPolicyRule = async (data) => {
    return database_1.prisma.escalationPolicyRule.create({
        data,
    });
};
exports.createEscalationPolicyRule = createEscalationPolicyRule;
const updateEscalationPolicyRule = async (id, data) => {
    return database_1.prisma.escalationPolicyRule.update({
        where: { id },
        data,
    });
};
exports.updateEscalationPolicyRule = updateEscalationPolicyRule;
const deleteEscalationPolicyRule = async (id) => {
    return database_1.prisma.escalationPolicyRule.delete({
        where: { id },
    });
};
exports.deleteEscalationPolicyRule = deleteEscalationPolicyRule;
//# sourceMappingURL=escalationPolicy.service.js.map