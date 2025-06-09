"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performBackgroundCheck = void 0;
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const TRANSUNION_API_URL = 'https://api.transunion.com/v1';
const getAuthHeaders = () => ({
    'Authorization': `Bearer ${process.env.TRANSUNION_API_KEY}`,
    'Content-Type': 'application/json',
});
const performBackgroundCheck = async (application) => {
    const response = await fetch(`${TRANSUNION_API_URL}/background-check`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            applicantId: application.applicantId,
            // ... other applicant data
        }),
    });
    if (!response.ok) {
        throw new errorMiddleware_1.AppError('Failed to perform background check', response.status);
    }
    return response.json();
};
exports.performBackgroundCheck = performBackgroundCheck;
//# sourceMappingURL=backgroundCheckService.js.map