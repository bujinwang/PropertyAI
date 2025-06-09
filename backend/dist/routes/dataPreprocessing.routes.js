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
const multer_1 = __importDefault(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
const dataPreprocessing_service_1 = require("../services/dataPreprocessing.service");
const auth_1 = require("../middleware/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
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
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        // Accept csv, json, txt, and image files
        const allowedExtensions = ['.csv', '.json', '.txt', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only CSV, JSON, TXT, and image files are allowed.'));
        }
    }
});
/**
 * @route   POST /api/data-preprocessing/datasets
 * @desc    Upload and register a new dataset
 * @access  Private
 */
router.post('/datasets', auth_1.protect, upload.single('file'), async (req, res) => {
    var _a;
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded'
            });
        }
        const { name, description, format } = req.body;
        if (!name || !format) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide dataset name and format'
            });
        }
        // Validate format
        if (!['json', 'csv', 'text', 'images'].includes(format)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid format. Must be one of: json, csv, text, images'
            });
        }
        // Register dataset
        const dataset = dataPreprocessing_service_1.dataPreprocessingService.registerDataset(name, format, req.file.path, description, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.status(201).json({
            status: 'success',
            data: dataset
        });
    }
    catch (error) {
        logger_1.default.error(`Error uploading dataset: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error uploading dataset'
        });
    }
});
/**
 * @route   GET /api/data-preprocessing/datasets
 * @desc    Get all datasets
 * @access  Private
 */
router.get('/datasets', auth_1.protect, (req, res) => {
    try {
        const datasets = dataPreprocessing_service_1.dataPreprocessingService.listDatasets();
        res.status(200).json({
            status: 'success',
            data: datasets
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting datasets: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error getting datasets'
        });
    }
});
/**
 * @route   GET /api/data-preprocessing/datasets/:datasetId
 * @desc    Get dataset by ID
 * @access  Private
 */
router.get('/datasets/:datasetId', auth_1.protect, (req, res) => {
    try {
        const { datasetId } = req.params;
        const dataset = dataPreprocessing_service_1.dataPreprocessingService.getDataset(datasetId);
        if (!dataset) {
            return res.status(404).json({
                status: 'error',
                message: `Dataset ${datasetId} not found`
            });
        }
        res.status(200).json({
            status: 'success',
            data: dataset
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting dataset ${req.params.datasetId}: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error getting dataset'
        });
    }
});
/**
 * @route   POST /api/data-preprocessing/datasets/:datasetId/preprocess
 * @desc    Preprocess a dataset
 * @access  Private
 */
router.post('/datasets/:datasetId/preprocess', auth_1.protect, async (req, res) => {
    try {
        const { datasetId } = req.params;
        const { cleanMissingValues, normalizeText, removeOutliers, redactPii, piiTypes, outputFormat } = req.body;
        const options = {
            cleanMissingValues: !!cleanMissingValues,
            normalizeText: !!normalizeText,
            removeOutliers: !!removeOutliers,
            redactPii: !!redactPii,
            piiTypes: piiTypes,
            outputFormat: outputFormat
        };
        const dataset = await dataPreprocessing_service_1.dataPreprocessingService.preprocessDataset(datasetId, options);
        res.status(200).json({
            status: 'success',
            data: dataset,
            message: 'Dataset preprocessing completed'
        });
    }
    catch (error) {
        logger_1.default.error(`Error preprocessing dataset ${req.params.datasetId}: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error preprocessing dataset'
        });
    }
});
/**
 * @route   DELETE /api/data-preprocessing/datasets/:datasetId
 * @desc    Delete a dataset
 * @access  Private
 */
router.delete('/datasets/:datasetId', auth_1.protect, (req, res) => {
    try {
        const { datasetId } = req.params;
        const success = dataPreprocessing_service_1.dataPreprocessingService.deleteDataset(datasetId);
        if (!success) {
            return res.status(404).json({
                status: 'error',
                message: `Dataset ${datasetId} not found`
            });
        }
        res.status(200).json({
            status: 'success',
            message: `Dataset ${datasetId} deleted successfully`
        });
    }
    catch (error) {
        logger_1.default.error(`Error deleting dataset ${req.params.datasetId}: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error deleting dataset'
        });
    }
});
exports.default = router;
//# sourceMappingURL=dataPreprocessing.routes.js.map