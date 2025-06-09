import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

/**
 * Interface for model metadata
 */
interface Model {
  id: string;
  name: string;
  version: string;
  description?: string;
  baseModel?: string;
  type: 'base' | 'fine-tuned' | 'custom';
  framework: 'pytorch' | 'tensorflow' | 'huggingface' | 'other';
  task: 'text-generation' | 'image-analysis' | 'sentiment-analysis' | 'classification' | 'other';
  createdAt: Date;
  createdBy: string;
  size: number;
  metrics?: {
    [key: string]: number;
  };
  tags: string[];
  path: string;
  isActive: boolean;
  isPublic: boolean;
}

/**
 * Service for managing AI model versions and artifacts
 */
class ModelRegistryService {
  private models: Map<string, Model>;
  private modelBasePath: string;

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
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Register a new model in the registry
   */
  registerModel(
    name: string,
    version: string,
    type: 'base' | 'fine-tuned' | 'custom',
    framework: 'pytorch' | 'tensorflow' | 'huggingface' | 'other',
    task: 'text-generation' | 'image-analysis' | 'sentiment-analysis' | 'classification' | 'other',
    modelPath: string,
    options: {
      description?: string;
      baseModel?: string;
      metrics?: { [key: string]: number };
      tags?: string[];
      isPublic?: boolean;
      userId?: string;
    } = {}
  ): Model {
    try {
      // Validate file exists
      if (!fs.existsSync(modelPath)) {
        throw new Error(`Model file not found: ${modelPath}`);
      }

      // Get file stats
      const stats = fs.statSync(modelPath);
      
      // Generate model ID
      const id = uuidv4();
      
      // Create target directory for model
      const modelDir = path.join(this.modelBasePath, id);
      this.ensureDirectoryExists(modelDir);
      
      // Copy model file to registry
      const targetPath = path.join(modelDir, path.basename(modelPath));
      fs.copyFileSync(modelPath, targetPath);
      
      // Create model metadata file
      const metadataPath = path.join(modelDir, 'metadata.json');
      
      // Create model record
      const model: Model = {
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
      
      logger.info(`Registered model ${id} (${name}:${version})`);
      
      return model;
    } catch (error) {
      logger.error(`Error registering model: ${error}`);
      throw error;
    }
  }

  /**
   * Get a model by ID
   */
  getModel(modelId: string): Model | null {
    return this.models.get(modelId) || null;
  }

  /**
   * Get latest version of a model by name
   */
  getLatestModelVersion(name: string): Model | null {
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
  private compareVersions(a: string, b: string): number {
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
  listModels(options: {
    type?: 'base' | 'fine-tuned' | 'custom';
    framework?: 'pytorch' | 'tensorflow' | 'huggingface' | 'other';
    task?: 'text-generation' | 'image-analysis' | 'sentiment-analysis' | 'classification' | 'other';
    name?: string;
    tags?: string[];
    activeOnly?: boolean;
  } = {}): Model[] {
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
      models = models.filter(model => 
        options.tags!.some(tag => model.tags.includes(tag))
      );
    }
    
    if (options.activeOnly) {
      models = models.filter(model => model.isActive);
    }
    
    return models;
  }

  /**
   * Update model metadata
   */
  updateModelMetadata(modelId: string, updates: {
    description?: string;
    metrics?: { [key: string]: number };
    tags?: string[];
    isActive?: boolean;
    isPublic?: boolean;
  }): Model | null {
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
  deleteModel(modelId: string): boolean {
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
      
      logger.info(`Deleted model ${modelId} (${model.name}:${model.version})`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting model ${modelId}: ${error}`);
      return false;
    }
  }
}

export const modelRegistryService = new ModelRegistryService(); 