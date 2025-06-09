"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forecastCashFlow = void 0;
const cashFlowForecasting_service_1 = require("../services/cashFlowForecasting.service");
const logger_1 = __importDefault(require("../utils/logger"));
const forecastCashFlow = async (req, res) => {
    const { months } = req.params;
    if (!months) {
        return res.status(400).json({ error: 'Number of months is required' });
    }
    try {
        const forecast = await cashFlowForecasting_service_1.cashFlowForecastingService.forecastCashFlow(parseInt(months));
        res.status(200).json(forecast);
    }
    catch (error) {
        logger_1.default.error(`Error forecasting cash flow: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.forecastCashFlow = forecastCashFlow;
//# sourceMappingURL=cashFlowForecasting.controller.js.map