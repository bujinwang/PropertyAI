"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictTenantIssue = void 0;
const predictTenantIssue = async (tenant) => {
    // This is a mock implementation.
    // In a real-world scenario, this would involve a more complex predictive model.
    const { maintenanceRequests, payments } = tenant;
    const latePayments = payments.filter(p => p.status === 'FAILED').length;
    const frequentIssues = maintenanceRequests.length > 5;
    if (latePayments > 2 || frequentIssues) {
        return {
            issue: 'High risk of lease termination',
            confidence: 0.85,
        };
    }
    return {
        issue: 'Low risk',
        confidence: 0.95,
    };
};
exports.predictTenantIssue = predictTenantIssue;
//# sourceMappingURL=predictiveModels.js.map