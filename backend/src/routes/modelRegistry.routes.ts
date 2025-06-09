import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { modelRegistryService } from '../services/modelRegistry.service';
import { protect } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// Configure multer for model file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'models');
    
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
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit for model files
});

/**
 * @route   POST /api/model-registry/models
 * @desc    Register a new model
 * @access  Private
 */
router.post('/models', protect, upload.single('modelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No model file uploaded'
      });
    }

    const {
      name,
      version,
      type,
      framework,
      task,
      description,
      baseModel,
      metrics,
      tags,
      isPublic
    } = req.body;
    
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
      } catch (error) {
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
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid tags format. Must be a valid JSON array'
        });
      }
    }

    // Register model
    const model = modelRegistryService.registerModel(
      name,
      version,
      type as 'base' | 'fine-tuned' | 'custom',
      framework as 'pytorch' | 'tensorflow' | 'huggingface' | 'other',
      task as 'text-generation' | 'image-analysis' | 'sentiment-analysis' | 'classification' | 'other',
      req.file.path,
      {
        description,
        baseModel,
        metrics: parsedMetrics,
        tags: parsedTags,
        isPublic: isPublic === 'true',
        userId: (req as any).user?.id
      }
    );
    
    res.status(201).json({
      status: 'success',
      data: model
    });
  } catch (error) {
    logger.error(`Error registering model: ${error}`);
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
router.get('/models', protect, (req, res) => {
  try {
    const { type, framework, task, name, tags, activeOnly } = req.query;
    
    // Parse tags if provided
    let parsedTags;
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags as string) : tags;
        if (!Array.isArray(parsedTags)) {
          throw new Error('Tags must be an array');
        }
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid tags format. Must be a valid JSON array'
        });
      }
    }
    
    const models = modelRegistryService.listModels({
      type: type as 'base' | 'fine-tuned' | 'custom',
      framework: framework as 'pytorch' | 'tensorflow' | 'huggingface' | 'other',
      task: task as 'text-generation' | 'image-analysis' | 'sentiment-analysis' | 'classification' | 'other',
      name: name as string,
      tags: parsedTags,
      activeOnly: activeOnly === 'true'
    });
    
    res.status(200).json({
      status: 'success',
      data: models
    });
  } catch (error) {
    logger.error(`Error listing models: ${error}`);
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
router.get('/models/:modelId', protect, (req, res) => {
  try {
    const { modelId } = req.params;
    const model = modelRegistryService.getModel(modelId);
    
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
  } catch (error) {
    logger.error(`Error getting model ${req.params.modelId}: ${error}`);
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
router.get('/models/latest/:name', protect, (req, res) => {
  try {
    const { name } = req.params;
    const model = modelRegistryService.getLatestModelVersion(name);
    
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
  } catch (error) {
    logger.error(`Error getting latest model version for ${req.params.name}: ${error}`);
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
router.patch('/models/:modelId', protect, (req, res) => {
  try {
    const { modelId } = req.params;
    const { description, metrics, tags, isActive, isPublic } = req.body;
    
    // Parse metrics if provided
    let parsedMetrics;
    if (metrics) {
      try {
        parsedMetrics = typeof metrics === 'string' ? JSON.parse(metrics) : metrics;
      } catch (error) {
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
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid tags format. Must be a valid JSON array'
        });
      }
    }
    
    const model = modelRegistryService.updateModelMetadata(modelId, {
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
  } catch (error) {
    logger.error(`Error updating model metadata for ${req.params.modelId}: ${error}`);
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
router.delete('/models/:modelId', protect, (req, res) => {
  try {
    const { modelId } = req.params;
    const success = modelRegistryService.deleteModel(modelId);
    
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
  } catch (error) {
    logger.error(`Error deleting model ${req.params.modelId}: ${error}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting model'
    });
  }
});

export default router; 