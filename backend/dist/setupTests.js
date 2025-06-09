"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
globals_1.jest.mock('@prisma/client', () => {
    const mockPrisma = {
        user: {
            findUnique: globals_1.jest.fn(),
        },
        tenantIssuePrediction: {
            create: globals_1.jest.fn(),
        },
        $transaction: globals_1.jest.fn().mockImplementation(async (callback) => {
            return callback(mockPrisma);
        }),
    };
    return {
        PrismaClient: globals_1.jest.fn(() => mockPrisma),
    };
});
//# sourceMappingURL=setupTests.js.map