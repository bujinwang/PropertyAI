"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class ApiService {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
        };
    }
    async get(endpoint, params) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/${endpoint}`, {
                headers: this.getHeaders(),
                params,
            });
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching data from ${endpoint}:`, error);
            throw error;
        }
    }
    async post(endpoint, data) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/${endpoint}`, data, {
                headers: this.getHeaders(),
            });
            return response.data;
        }
        catch (error) {
            console.error(`Error posting data to ${endpoint}:`, error);
            throw error;
        }
    }
}
exports.default = ApiService;
//# sourceMappingURL=api.service.js.map