import express from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { dataPreprocessingService } from '../services/dataPreprocessing.service';
import { protect } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept csv, json, txt, and image files
    const allowedExtensions = ['.csv', '.json', '.txt', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, TXT, and image files are allowed.'));
    }
  }
});

/**
 * @route   POST /api/data-preprocessing/datasets
 * @desc    Upload and register a new dataset
 * @access  Private
 */
router.post('/datasets', protect, upload.single('file') as any, async (req, res) => {
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
    const dataset = dataPreprocessingService.registerDataset(
      name,
      format as 'json' | 'csv' | 'text' | 'images',
      req.file.path,
      description,
      (req as any).user?.id
    );
    
    res.status(201).json({
      status: 'success',
      data: dataset
    });
  } catch (error) {
    logger.error(`Error uploading dataset: ${error}`);
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
router.get('/datasets', protect, (req, res) => {
  try {
    const datasets = dataPreprocessingService.listDatasets();
    
    res.status(200).json({
      status: 'success',
      data: datasets
    });
  } catch (error) {
    logger.error(`Error getting datasets: ${error}`);
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
router.get('/datasets/:datasetId', protect, (req, res) => {
  try {
    const { datasetId } = req.params;
    const dataset = dataPreprocessingService.getDataset(datasetId);
    
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
  } catch (error) {
    logger.error(`Error getting dataset ${req.params.datasetId}: ${error}`);
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
router.post('/datasets/:datasetId/preprocess', protect, async (req, res) => {
  try {
    const { datasetId } = req.params;
    const {
      cleanMissingValues,
      normalizeText,
      removeOutliers,
      redactPii,
      piiTypes,
      outputFormat
    } = req.body;
    
    const options = {
      cleanMissingValues: !!cleanMissingValues,
      normalizeText: !!normalizeText,
      removeOutliers: !!removeOutliers,
      redactPii: !!redactPii,
      piiTypes: piiTypes as Array<'email' | 'phone' | 'ssn' | 'address' | 'name' | 'creditCard' | 'all'>,
      outputFormat: outputFormat as 'json' | 'csv' | 'text'
    };
    
    const dataset = await dataPreprocessingService.preprocessDataset(datasetId, options);
    
    res.status(200).json({
      status: 'success',
      data: dataset,
      message: 'Dataset preprocessing completed'
    });
  } catch (error) {
    logger.error(`Error preprocessing dataset ${req.params.datasetId}: ${error}`);
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
router.delete('/datasets/:datasetId', protect, (req, res) => {
  try {
    const { datasetId } = req.params;
    const success = dataPreprocessingService.deleteDataset(datasetId);
    
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
  } catch (error) {
    logger.error(`Error deleting dataset ${req.params.datasetId}: ${error}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting dataset'
    });
  }
});

export default router; 