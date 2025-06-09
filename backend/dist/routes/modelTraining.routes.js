"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const modelTraining_service_1 = require("../services/modelTraining.service");
const dataPreprocessing_service_1 = require("../services/dataPreprocessing.service");
const modelRegistry_service_1 = require("../services/modelRegistry.service");
const auth_1 = require("../middleware/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
/**
 * @route   POST /api/model-training/jobs
 * @desc    Start a new model training job
 * @access  Private
 */
router.post('/jobs', auth_1.protect, async (req, res) => {
    try {
        const { baseModelId, datasetId, hyperparameters, outputModelName, description } = req.body;
        // Validate required fields
        if (!baseModelId || !datasetId || !outputModelName) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields: baseModelId, datasetId, outputModelName'
            });
        }
        // Validate that the base model exists
        const baseModel = modelRegistry_service_1.modelRegistryService.getModel(baseModelId);
        if (!baseModel) {
            return res.status(404).json({
                status: 'error',
                message: `Base model with ID ${baseModelId} not found`
            });
        }
        // Validate that the dataset exists and is preprocessed
        const dataset = dataPreprocessing_service_1.dataPreprocessingService.getDataset(datasetId);
        if (!dataset) {
            return res.status(404).json({
                status: 'error',
                message: `Dataset with ID ${datasetId} not found`
            });
        }
        if (!dataset.preprocessed) {
            return res.status(400).json({
                status: 'error',
                message: `Dataset ${datasetId} has not been preprocessed`
            });
        }
        // Start training job
        const jobId = await modelTraining_service_1.modelTrainingService.startTrainingJob({
            baseModelId,
            datasetId,
            hyperparameters,
            outputModelName,
            description
        });
        res.status(201).json({
            status: 'success',
            data: {
                jobId,
                message: 'Training job started successfully'
            }
        });
    }
    catch (error) {
        logger_1.default.error(`Error starting training job: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error starting training job'
        });
    }
});
/**
 * @route   GET /api/model-training/jobs
 * @desc    Get all training jobs
 * @access  Private
 */
router.get('/jobs', auth_1.protect, (req, res) => {
    try {
        const jobs = modelTraining_service_1.modelTrainingService.listJobs();
        res.status(200).json({
            status: 'success',
            data: jobs
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting training jobs: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error getting training jobs'
        });
    }
});
/**
 * @route   GET /api/model-training/jobs/:jobId
 * @desc    Get status of a training job
 * @access  Private
 */
router.get('/jobs/:jobId', auth_1.protect, (req, res) => {
    try {
        const { jobId } = req.params;
        const job = modelTraining_service_1.modelTrainingService.getJobStatus(jobId);
        if (!job) {
            return res.status(404).json({
                status: 'error',
                message: `Training job ${jobId} not found`
            });
        }
        res.status(200).json({
            status: 'success',
            data: job
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting training job ${req.params.jobId}: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error getting training job'
        });
    }
});
/**
 * @route   DELETE /api/model-training/jobs/:jobId
 * @desc    Cancel a training job
 * @access  Private
 */
router.delete('/jobs/:jobId', auth_1.protect, (req, res) => {
    try {
        const { jobId } = req.params;
        const success = modelTraining_service_1.modelTrainingService.cancelJob(jobId);
        if (!success) {
            return res.status(404).json({
                status: 'error',
                message: `Training job ${jobId} not found or cannot be cancelled`
            });
        }
        res.status(200).json({
            status: 'success',
            message: `Training job ${jobId} cancelled successfully`
        });
    }
    catch (error) {
        logger_1.default.error(`Error cancelling training job ${req.params.jobId}: ${error}`);
        res.status(500).json({
            status: 'error',
            message: 'Server error cancelling training job'
        });
    }
});
exports.default = router;
//# sourceMappingURL=modelTraining.routes.js.map