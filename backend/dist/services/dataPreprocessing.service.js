"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataPreprocessingService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Service for preprocessing data before model training
 */
class DataPreprocessingService {
    constructor() {
        this.datasets = new Map();
        // In production, this would be a configured environment variable
        this.datasetBasePath = process.env.DATASET_PATH || path.join(process.cwd(), 'data', 'datasets');
        // Ensure directory exists
        this.ensureDirectoryExists(this.datasetBasePath);
    }
    /**
     * Ensure a directory exists, creating it if necessary
     */
    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    /**
     * Register a new dataset
     */
    registerDataset(name, format, filePath, description, userId) {
        try {
            // Validate file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            // Get file stats
            const stats = fs.statSync(filePath);
            // Generate dataset ID
            const id = (0, uuid_1.v4)();
            // Copy file to datasets directory
            const targetPath = path.join(this.datasetBasePath, `${id}${path.extname(filePath)}`);
            fs.copyFileSync(filePath, targetPath);
            // Create dataset record
            const dataset = {
                id,
                name,
                description,
                format,
                size: stats.size,
                recordCount: 0, // Will be calculated during preprocessing
                createdAt: new Date(),
                createdBy: userId || 'system',
                preprocessed: false,
                piiRedacted: false,
                path: targetPath
            };
            // Store dataset in memory (in production, would be stored in database)
            this.datasets.set(id, dataset);
            return dataset;
        }
        catch (error) {
            logger_1.default.error(`Error registering dataset: ${error}`);
            throw error;
        }
    }
    /**
     * Preprocess a dataset
     */
    async preprocessDataset(datasetId, options = {}) {
        try {
            const dataset = this.datasets.get(datasetId);
            if (!dataset) {
                throw new Error(`Dataset ${datasetId} not found`);
            }
            logger_1.default.info(`Preprocessing dataset ${datasetId} (${dataset.name})`);
            // In a real implementation, this would:
            // 1. Read the dataset from storage
            // 2. Apply preprocessing steps based on options
            // 3. Save the preprocessed dataset
            // 4. Update dataset metadata
            // For now, we'll simulate the preprocessing
            const preprocessedPath = `${dataset.path}.preprocessed`;
            // Simulate preprocessing based on options
            if (options.cleanMissingValues) {
                logger_1.default.info(`Cleaning missing values in dataset ${datasetId}`);
                // In a real implementation, this would clean missing values
            }
            if (options.normalizeText) {
                logger_1.default.info(`Normalizing text in dataset ${datasetId}`);
                // In a real implementation, this would normalize text
            }
            if (options.removeOutliers) {
                logger_1.default.info(`Removing outliers from dataset ${datasetId}`);
                // In a real implementation, this would remove outliers
            }
            if (options.redactPii) {
                await this.redactPii(dataset, options.piiTypes || ['all']);
            }
            // Update dataset record
            dataset.preprocessed = true;
            dataset.piiRedacted = !!options.redactPii;
            // In a real implementation, we would save the preprocessed dataset
            // and update the path to point to the preprocessed version
            return dataset;
        }
        catch (error) {
            logger_1.default.error(`Error preprocessing dataset ${datasetId}: ${error}`);
            throw error;
        }
    }
    /**
     * Redact PII from a dataset
     */
    async redactPii(dataset, piiTypes) {
        logger_1.default.info(`Redacting PII (${piiTypes.join(', ')}) from dataset ${dataset.id}`);
        // In a real implementation, this would:
        // 1. Read the dataset
        // 2. Use regex patterns or NER models to identify PII
        // 3. Replace PII with placeholders or masked values
        // 4. Save the redacted dataset
        // Simulating PII redaction
        if (dataset.format === 'json' || dataset.format === 'csv') {
            // For structured data, we would parse and process each field
            logger_1.default.info(`Processing structured data (${dataset.format}) for PII redaction`);
        }
        else if (dataset.format === 'text') {
            // For text data, we would use regex or NER to identify and redact PII
            logger_1.default.info('Processing text data for PII redaction');
        }
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        logger_1.default.info(`PII redaction completed for dataset ${dataset.id}`);
    }
    /**
     * Get a dataset by ID
     */
    getDataset(datasetId) {
        return this.datasets.get(datasetId) || null;
    }
    /**
     * List all datasets
     */
    listDatasets() {
        return Array.from(this.datasets.values());
    }
    /**
     * Delete a dataset
     */
    deleteDataset(datasetId) {
        const dataset = this.datasets.get(datasetId);
        if (!dataset) {
            return false;
        }
        // Delete dataset file
        if (fs.existsSync(dataset.path)) {
            fs.unlinkSync(dataset.path);
        }
        // Delete preprocessed dataset if it exists
        const preprocessedPath = `${dataset.path}.preprocessed`;
        if (fs.existsSync(preprocessedPath)) {
            fs.unlinkSync(preprocessedPath);
        }
        // Remove from map
        this.datasets.delete(datasetId);
        return true;
    }
}
exports.dataPreprocessingService = new DataPreprocessingService();
//# sourceMappingURL=dataPreprocessing.service.js.map