"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSlowQueries = void 0;
const databaseOptimization_service_1 = require("../services/databaseOptimization.service");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Controller for handling database optimization tasks.
 */
const analyzeSlowQueries = async (req, res, next) => {
    try {
        logger_1.default.info('Starting analysis of PostgreSQL slow queries...');
        const slowQueries = await databaseOptimization_service_1.databaseOptimizationService.analyzePostgresSlowQueries();
        if (slowQueries.length === 0) {
            res.status(200).json({
                message: 'No slow queries found matching the criteria.',
                data: [],
            });
            return;
        }
        res.status(200).json({
            message: 'Slow query analysis completed successfully.',
            data: slowQueries,
        });
    }
    catch (error) {
        logger_1.default.error(`Error during slow query analysis: ${error}`);
        next(error);
    }
};
exports.analyzeSlowQueries = analyzeSlowQueries;
//# sourceMappingURL=databaseOptimization.controller.js.map