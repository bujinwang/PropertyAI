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
exports.modelRegistryService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Service for managing AI model versions and artifacts
 */
class ModelRegistryService {
    constructor() {
        this.models = new Map();
        // In production, this would be a configured environment variable
        this.modelBasePath = process.env.MODEL_PATH || path.join(process.cwd(), 'data', 'models');
        // Ensure directory exists
        this.ensureDirectoryExists(this.modelBasePath);
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
     * Register a new model in the registry
     */
    registerModel(name, version, type, framework, task, modelPath, options = {}) {
        try {
            // Validate file exists
            if (!fs.existsSync(modelPath)) {
                throw new Error(`Model file not found: ${modelPath}`);
            }
            // Get file stats
            const stats = fs.statSync(modelPath);
            // Generate model ID
            const id = (0, uuid_1.v4)();
            // Create target directory for model
            const modelDir = path.join(this.modelBasePath, id);
            this.ensureDirectoryExists(modelDir);
            // Copy model file to registry
            const targetPath = path.join(modelDir, path.basename(modelPath));
            fs.copyFileSync(modelPath, targetPath);
            // Create model metadata file
            const metadataPath = path.join(modelDir, 'metadata.json');
            // Create model record
            const model = {
                id,
                name,
                version,
                description: options.description,
                baseModel: options.baseModel,
                type,
                framework,
                task,
                createdAt: new Date(),
                createdBy: options.userId || 'system',
                size: stats.size,
                metrics: options.metrics || {},
                tags: options.tags || [],
                path: targetPath,
                isActive: true,
                isPublic: options.isPublic || false
            };
            // Save metadata to file
            fs.writeFileSync(metadataPath, JSON.stringify(model, null, 2));
            // Store model in memory (in production, would be stored in database)
            this.models.set(id, model);
            logger_1.default.info(`Registered model ${id} (${name}:${version})`);
            return model;
        }
        catch (error) {
            logger_1.default.error(`Error registering model: ${error}`);
            throw error;
        }
    }
    /**
     * Get a model by ID
     */
    getModel(modelId) {
        return this.models.get(modelId) || null;
    }
    /**
     * Get latest version of a model by name
     */
    getLatestModelVersion(name) {
        const models = Array.from(this.models.values())
            .filter(model => model.name === name && model.isActive)
            .sort((a, b) => {
            // Sort by version (assuming semver-like versioning)
            return this.compareVersions(b.version, a.version);
        });
        return models.length > 0 ? models[0] : null;
    }
    /**
     * Simple version comparison (for semver-like versions)
     */
    compareVersions(a, b) {
        const partsA = a.split('.').map(Number);
        const partsB = b.split('.').map(Number);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const partA = i < partsA.length ? partsA[i] : 0;
            const partB = i < partsB.length ? partsB[i] : 0;
            if (partA !== partB) {
                return partA - partB;
            }
        }
        return 0;
    }
    /**
     * List all models
     */
    listModels(options = {}) {
        let models = Array.from(this.models.values());
        // Apply filters
        if (options.type) {
            models = models.filter(model => model.type === options.type);
        }
        if (options.framework) {
            models = models.filter(model => model.framework === options.framework);
        }
        if (options.task) {
            models = models.filter(model => model.task === options.task);
        }
        if (options.name) {
            models = models.filter(model => model.name === options.name);
        }
        if (options.tags && options.tags.length > 0) {
            models = models.filter(model => options.tags.some(tag => model.tags.includes(tag)));
        }
        if (options.activeOnly) {
            models = models.filter(model => model.isActive);
        }
        return models;
    }
    /**
     * Update model metadata
     */
    updateModelMetadata(modelId, updates) {
        const model = this.models.get(modelId);
        if (!model) {
            return null;
        }
        // Update model properties
        if (updates.description !== undefined) {
            model.description = updates.description;
        }
        if (updates.metrics) {
            model.metrics = { ...model.metrics, ...updates.metrics };
        }
        if (updates.tags) {
            model.tags = updates.tags;
        }
        if (updates.isActive !== undefined) {
            model.isActive = updates.isActive;
        }
        if (updates.isPublic !== undefined) {
            model.isPublic = updates.isPublic;
        }
        // Update metadata file
        const modelDir = path.dirname(model.path);
        const metadataPath = path.join(modelDir, 'metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify(model, null, 2));
        return model;
    }
    /**
     * Delete a model
     */
    deleteModel(modelId) {
        const model = this.models.get(modelId);
        if (!model) {
            return false;
        }
        try {
            // Delete model directory
            const modelDir = path.dirname(model.path);
            if (fs.existsSync(modelDir)) {
                fs.rmSync(modelDir, { recursive: true, force: true });
            }
            // Remove from map
            this.models.delete(modelId);
            logger_1.default.info(`Deleted model ${modelId} (${model.name}:${model.version})`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Error deleting model ${modelId}: ${error}`);
            return false;
        }
    }
}
exports.modelRegistryService = new ModelRegistryService();
//# sourceMappingURL=modelRegistry.service.js.map