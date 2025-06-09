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
const express_1 = __importDefault(require("express"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const modelRegistry_service_1 = require("../services/modelRegistry.service");
const auth_1 = require("../middleware/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
// Configure multer for model file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'models');
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `${(0, uuid_1.v4)()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit for model files
});
/**
 * @route   POST /api/model-registry/models
 * @desc    Register a new model
 * @access  Private
 */
router.post('/models', auth_1.protect, upload.single('modelFile'), async (req, res) => {
    var _a;
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No model file uploaded'
            });
        }
        const { name, version, type, framework, task, description, baseModel, metrics, tags, isPublic } = req.body;
        // Validate required fields
        if (!name || !version || !type || !framework || !task) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields: name, version, type, framework, task'
            });
        }
        // Validate type
        if (!['base', 'fine-tuned', 'custom'].includes(type)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid model type. Must be one of: base, fine-tuned, custom'
            });
        }
        // Validate framework
        if (!['pytorch', 'tensorflow', 'huggingface', 'other'].includes(framework)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid framework. Must be one of: pytorch, tensorflow, huggingface, other'
            });
        }
        // Validate task
        if (!['text-generation', 'image-analysis', 'sentiment-analysis', 'classification', 'other'].includes(task)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid task. Must be one of: text-generation, image-analysis, sentiment-analysis, classification, other'
            });
        }
        // Parse metrics if provided
        let parsedMetrics;
        if (metrics) {
            try {
                parsedMetrics = typeof metrics === 'string' ? JSON.parse(metrics) : metrics;
            }
            catch (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid metrics format. Must be a valid JSON object'
                });
            }
        }
        // Parse tags if provided
        let parsedTags;
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
                if (!Array.isArray(parsedTags)) {
                    throw new Error('Tags must be an array');
                }
            }
            catch (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid tags format. Must be a valid JSON array'
                });
            }
        }
        // Register model
        const model = modelRegistry_service_1.modelRegistryService.registerModel(name, version, type, framework, task, req.file.path, {
            description,
            baseModel,
            metrics: parsedMetrics,
            tags: parsedTags,
            isPublic: isPublic === 'true',
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
        });
        res.status(201).json({
            status: 'success',
            data: model
        });
    }
    catch (error) {
        logger_1.default.error(`Error registering model: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error registering model'
        });
    }
});
/**
 * @route   GET /api/model-registry/models
 * @desc    Get all models with optional filtering
 * @access  Private
 */
router.get('/models', auth_1.protect, (req, res) => {
    try {
        const { type, framework, task, name, tags, activeOnly } = req.query;
        // Parse tags if provided
        let parsedTags;
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
                if (!Array.isArray(parsedTags)) {
                    throw new Error('Tags must be an array');
                }
            }
            catch (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid tags format. Must be a valid JSON array'
                });
            }
        }
        const models = modelRegistry_service_1.modelRegistryService.listModels({
            type: type,
            framework: framework,
            task: task,
            name: name,
            tags: parsedTags,
            activeOnly: activeOnly === 'true'
        });
        res.status(200).json({
            status: 'success',
            data: models
        });
    }
    catch (error) {
        logger_1.default.error(`Error listing models: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error listing models'
        });
    }
});
/**
 * @route   GET /api/model-registry/models/:modelId
 * @desc    Get model by ID
 * @access  Private
 */
router.get('/models/:modelId', auth_1.protect, (req, res) => {
    try {
        const { modelId } = req.params;
        const model = modelRegistry_service_1.modelRegistryService.getModel(modelId);
        if (!model) {
            return res.status(404).json({
                status: 'error',
                message: `Model ${modelId} not found`
            });
        }
        res.status(200).json({
            status: 'success',
            data: model
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting model ${req.params.modelId}: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error getting model'
        });
    }
});
/**
 * @route   GET /api/model-registry/models/latest/:name
 * @desc    Get latest version of a model by name
 * @access  Private
 */
router.get('/models/latest/:name', auth_1.protect, (req, res) => {
    try {
        const { name } = req.params;
        const model = modelRegistry_service_1.modelRegistryService.getLatestModelVersion(name);
        if (!model) {
            return res.status(404).json({
                status: 'error',
                message: `No active models found with name ${name}`
            });
        }
        res.status(200).json({
            status: 'success',
            data: model
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting latest model version for ${req.params.name}: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error getting latest model version'
        });
    }
});
/**
 * @route   PATCH /api/model-registry/models/:modelId
 * @desc    Update model metadata
 * @access  Private
 */
router.patch('/models/:modelId', auth_1.protect, (req, res) => {
    try {
        const { modelId } = req.params;
        const { description, metrics, tags, isActive, isPublic } = req.body;
        // Parse metrics if provided
        let parsedMetrics;
        if (metrics) {
            try {
                parsedMetrics = typeof metrics === 'string' ? JSON.parse(metrics) : metrics;
            }
            catch (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid metrics format. Must be a valid JSON object'
                });
            }
        }
        // Parse tags if provided
        let parsedTags;
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
                if (!Array.isArray(parsedTags)) {
                    throw new Error('Tags must be an array');
                }
            }
            catch (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid tags format. Must be a valid JSON array'
                });
            }
        }
        const model = modelRegistry_service_1.modelRegistryService.updateModelMetadata(modelId, {
            description,
            metrics: parsedMetrics,
            tags: parsedTags,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined
        });
        if (!model) {
            return res.status(404).json({
                status: 'error',
                message: `Model ${modelId} not found`
            });
        }
        res.status(200).json({
            status: 'success',
            data: model,
            message: 'Model metadata updated successfully'
        });
    }
    catch (error) {
        logger_1.default.error(`Error updating model metadata for ${req.params.modelId}: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error updating model metadata'
        });
    }
});
/**
 * @route   DELETE /api/model-registry/models/:modelId
 * @desc    Delete a model
 * @access  Private
 */
router.delete('/models/:modelId', auth_1.protect, (req, res) => {
    try {
        const { modelId } = req.params;
        const success = modelRegistry_service_1.modelRegistryService.deleteModel(modelId);
        if (!success) {
            return res.status(404).json({
                status: 'error',
                message: `Model ${modelId} not found`
            });
        }
        res.status(200).json({
            status: 'success',
            message: `Model ${modelId} deleted successfully`
        });
    }
    catch (error) {
        logger_1.default.error(`Error deleting model ${req.params.modelId}: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error deleting model'
        });
    }
});
exports.default = router;
//# sourceMappingURL=modelRegistry.routes.js.map