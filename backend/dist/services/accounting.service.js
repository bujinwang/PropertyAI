"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountingService = void 0;
const api_service_1 = __importDefault(require("./api.service"));
class AccountingService {
    constructor() {
        this.quickBooksApi = new api_service_1.default('https://sandbox-quickbooks.api.intuit.com', process.env.QUICKBOOKS_API_KEY);
        this.xeroApi = new api_service_1.default('https://api.xero.com', process.env.XERO_API_KEY);
    }
    async syncToQuickBooks(data) {
        try {
            const response = await this.quickBooksApi.post('/v3/company/123146428700338/invoice', data);
            return response;
        }
        catch (error) {
            console.error('Error syncing to QuickBooks:', error);
            throw error;
        }
    }
    async syncToXero(data) {
        try {
            const response = await this.xeroApi.post('/api.xro/2.0/Invoices', data);
            return response;
        }
        catch (error) {
            console.error('Error syncing to Xero:', error);
            throw error;
        }
    }
}
exports.accountingService = new AccountingService();
//# sourceMappingURL=accounting.service.js.map