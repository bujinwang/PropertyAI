/**
 * Automated Property Tagging Service
 * Intelligent tagging system for property photos and data
 * Epic 21.5.3 - Advanced Features
 */

export interface PropertyTag {
  id: string;
  category: TagCategory;
  value: string;
  confidence: number;
  source: 'ai_analysis' | 'manual' | 'inferred' | 'calculated';
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface TagCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PropertyTags {
  propertyId: string;
  tags: PropertyTag[];
  summary: {
    totalTags: number;
    categories: Record<string, number>;
    lastUpdated: number;
    confidence: number;
  };
}

export interface TaggingRule {
  id: string;
  name: string;
  description: string;
  conditions: TaggingCondition[];
  actions: TaggingAction[];
  priority: number;
  enabled: boolean;
}

export interface TaggingCondition {
  type: 'analysis_result' | 'property_data' | 'location' | 'time' | 'custom';
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'regex';
  value: any;
}

export interface TaggingAction {
  type: 'add_tag' | 'remove_tag' | 'update_tag' | 'notify' | 'escalate';
  parameters: Record<string, any>;
}

export interface TaggingOptions {
  enableAutoTagging?: boolean;
  confidenceThreshold?: number;
  maxTagsPerCategory?: number;
  includeInferredTags?: boolean;
  customRules?: TaggingRule[];
}

class PropertyTaggingService {
  private readonly STORAGE_KEY = 'property_tags';
  private readonly RULES_KEY = 'tagging_rules';

  private tagsCache = new Map<string, PropertyTags>();
  private defaultCategories: TagCategory[] = [
    {
      id: 'condition',
      name: 'Property Condition',
      description: 'Overall property condition assessment',
      color: '#2196f3',
      icon: '🏠',
      priority: 'high'
    },
    {
      id: 'features',
      name: 'Property Features',
      description: 'Key property features and amenities',
      color: '#4caf50',
      icon: '✨',
      priority: 'high'
    },
    {
      id: 'issues',
      name: 'Maintenance Issues',
      description: 'Identified maintenance or repair needs',
      color: '#f44336',
      icon: '🔧',
      priority: 'high'
    },
    {
      id: 'location',
      name: 'Location & Area',
      description: 'Location-based characteristics',
      color: '#ff9800',
      icon: '📍',
      priority: 'medium'
    },
    {
      id: 'market',
      name: 'Market Position',
      description: 'Market-related characteristics',
      color: '#9c27b0',
      icon: '📊',
      priority: 'medium'
    },
    {
      id: 'seasonal',
      name: 'Seasonal Notes',
      description: 'Season or time-related observations',
      color: '#00bcd4',
      icon: '🌤️',
      priority: 'low'
    }
  ];

  private defaultRules: TaggingRule[] = [
    {
      id: 'condition_critical',
      name: 'Critical Condition Alert',
      description: 'Tag properties with critical condition issues',
      conditions: [
        {
          type: 'analysis_result',
          field: 'condition',
          operator: 'equals',
          value: 'critical'
        }
      ],
      actions: [
        {
          type: 'add_tag',
          parameters: {
            category: 'condition',
            value: 'Critical Condition',
            priority: 'high'
          }
        },
        {
          type: 'notify',
          parameters: {
            message: 'Critical condition detected',
            priority: 'high'
          }
        }
      ],
      priority: 10,
      enabled: true
    },
    {
      id: 'roof_condition',
      name: 'Roof Condition Tagging',
      description: 'Tag based on roof condition analysis',
      conditions: [
        {
          type: 'analysis_result',
          field: 'features',
          operator: 'contains',
          value: 'roof'
        }
      ],
      actions: [
        {
          type: 'add_tag',
          parameters: {
            category: 'features',
            value: 'Roof Present',
            priority: 'medium'
          }
        }
      ],
      priority: 5,
      enabled: true
    }
  ];

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadPersistedData();
      console.log('[Property Tagging] Service initialized');
    } catch (error) {
      console.warn('[Property Tagging] Initialization failed:', error);
    }
  }

  // Generate tags for a property based on analysis results
  async generateTags(
    propertyId: string,
    analysisResult: any,
    options: TaggingOptions = {}
  ): Promise<PropertyTags> {
    const startTime = performance.now();

    try {
      // Get existing tags
      const existingTags = this.tagsCache.get(propertyId) || {
        propertyId,
        tags: [],
        summary: {
          totalTags: 0,
          categories: {},
          lastUpdated: Date.now(),
          confidence: 0
        }
      };

      // Generate new tags from analysis
      const newTags = await this.generateTagsFromAnalysis(analysisResult, options);

      // Apply custom rules
      const ruleTags = await this.applyTaggingRules(propertyId, analysisResult, options);

      // Combine and deduplicate tags
      const allTags = this.mergeTags([...existingTags.tags, ...newTags, ...ruleTags]);

      // Filter by confidence threshold
      const filteredTags = this.filterByConfidence(allTags, options.confidenceThreshold || 0.6);

      // Limit tags per category
      const limitedTags = this.limitTagsPerCategory(filteredTags, options.maxTagsPerCategory || 10);

      // Create summary
      const summary = this.generateSummary(limitedTags);

      const result: PropertyTags = {
        propertyId,
        tags: limitedTags,
        summary: {
          ...summary,
          lastUpdated: Date.now()
        }
      };

      // Cache result
      this.tagsCache.set(propertyId, result);

      // Persist to storage
      await this.persistTags(result);

      const processingTime = performance.now() - startTime;
      console.log(`[Property Tagging] Generated ${limitedTags.length} tags in ${processingTime.toFixed(2)}ms`);

      return result;

    } catch (error) {
      console.error('[Property Tagging] Tag generation failed:', error);
      throw error;
    }
  }

  // Get tags for a property
  getPropertyTags(propertyId: string): PropertyTags | null {
    return this.tagsCache.get(propertyId) || null;
  }

  // Update tags for a property
  async updateTags(
    propertyId: string,
    updates: Array<{ tagId: string; updates: Partial<PropertyTag> }>
  ): Promise<PropertyTags> {
    const existing = this.tagsCache.get(propertyId);
    if (!existing) {
      throw new Error(`Property ${propertyId} not found`);
    }

    // Apply updates
    const updatedTags = existing.tags.map(tag => {
      const update = updates.find(u => u.tagId === tag.id);
      return update ? { ...tag, ...update.updates } : tag;
    });

    const result: PropertyTags = {
      ...existing,
      tags: updatedTags,
      summary: {
        ...this.generateSummary(updatedTags),
        lastUpdated: Date.now()
      }
    };

    this.tagsCache.set(propertyId, result);
    await this.persistTags(result);

    return result;
  }

  // Remove tags from a property
  async removeTags(propertyId: string, tagIds: string[]): Promise<PropertyTags> {
    const existing = this.tagsCache.get(propertyId);
    if (!existing) {
      throw new Error(`Property ${propertyId} not found`);
    }

    const filteredTags = existing.tags.filter(tag => !tagIds.includes(tag.id));

    const result: PropertyTags = {
      ...existing,
      tags: filteredTags,
      summary: {
        ...this.generateSummary(filteredTags),
        lastUpdated: Date.now()
      }
    };

    this.tagsCache.set(propertyId, result);
    await this.persistTags(result);

    return result;
  }

  // Search tags across properties
  searchTags(query: {
    category?: string;
    value?: string;
    confidence?: { min?: number; max?: number };
    source?: PropertyTag['source'];
    dateRange?: { start: number; end: number };
  }): PropertyTags[] {
    const results: PropertyTags[] = [];

    for (const [propertyId, propertyTags] of Array.from(this.tagsCache.entries())) {
      const matchingTags = propertyTags.tags.filter((tag: PropertyTag) => {
        if (query.category && tag.category.id !== query.category) return false;
        if (query.value && !tag.value.toLowerCase().includes(query.value.toLowerCase())) return false;
        if (query.source && tag.source !== query.source) return false;
        if (query.confidence) {
          if (query.confidence.min && tag.confidence < query.confidence.min) return false;
          if (query.confidence.max && tag.confidence > query.confidence.max) return false;
        }
        if (query.dateRange) {
          if (tag.timestamp < query.dateRange.start || tag.timestamp > query.dateRange.end) return false;
        }
        return true;
      });

      if (matchingTags.length > 0) {
        results.push({
          ...propertyTags,
          tags: matchingTags
        });
      }
    }

    return results;
  }

  // Get available tag categories
  getTagCategories(): TagCategory[] {
    return [...this.defaultCategories];
  }

  // Add custom tagging rule
  async addTaggingRule(rule: TaggingRule): Promise<void> {
    this.defaultRules.push(rule);
    await this.persistRules();
  }

  // Remove tagging rule
  async removeTaggingRule(ruleId: string): Promise<void> {
    this.defaultRules = this.defaultRules.filter(rule => rule.id !== ruleId);
    await this.persistRules();
  }

  // Get all tagging rules
  getTaggingRules(): TaggingRule[] {
    return [...this.defaultRules];
  }

  // Export tags for a property
  exportTags(propertyId: string, format: 'json' | 'csv' = 'json'): string {
    const propertyTags = this.tagsCache.get(propertyId);
    if (!propertyTags) {
      throw new Error(`Property ${propertyId} not found`);
    }

    if (format === 'csv') {
      const headers = ['Category', 'Tag', 'Confidence', 'Source', 'Timestamp'];
      const rows = propertyTags.tags.map(tag => [
        tag.category.name,
        tag.value,
        tag.confidence.toString(),
        tag.source,
        new Date(tag.timestamp).toISOString()
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(propertyTags, null, 2);
  }

  // Import tags for a property
  async importTags(propertyId: string, data: string, format: 'json' | 'csv' = 'json'): Promise<PropertyTags> {
    let importedTags: PropertyTag[];

    if (format === 'csv') {
      const lines = data.split('\n');
      const headers = lines[0].split(',');
      importedTags = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          id: `imported_${Date.now()}_${Math.random()}`,
          category: this.defaultCategories.find(cat => cat.name === values[0]) || this.defaultCategories[0],
          value: values[1],
          confidence: parseFloat(values[2]),
          source: values[3] as PropertyTag['source'],
          timestamp: new Date(values[4]).getTime()
        };
      });
    } else {
      const parsed = JSON.parse(data);
      importedTags = parsed.tags || [];
    }

    const result: PropertyTags = {
      propertyId,
      tags: importedTags,
      summary: {
        ...this.generateSummary(importedTags),
        lastUpdated: Date.now()
      }
    };

    this.tagsCache.set(propertyId, result);
    await this.persistTags(result);

    return result;
  }

  // Private methods

  private async generateTagsFromAnalysis(analysisResult: any, options: TaggingOptions): Promise<PropertyTag[]> {
    const tags: PropertyTag[] = [];

    // Property type tag
    if (analysisResult.propertyType) {
      tags.push({
        id: `type_${Date.now()}`,
        category: this.defaultCategories.find(cat => cat.id === 'features')!,
        value: `Property Type: ${analysisResult.propertyType}`,
        confidence: 0.9,
        source: 'ai_analysis',
        timestamp: Date.now()
      });
    }

    // Condition tag
    if (analysisResult.condition) {
      tags.push({
        id: `condition_${Date.now()}`,
        category: this.defaultCategories.find(cat => cat.id === 'condition')!,
        value: `Condition: ${analysisResult.condition}`,
        confidence: 0.85,
        source: 'ai_analysis',
        timestamp: Date.now()
      });
    }

    // Feature tags
    if (analysisResult.features && Array.isArray(analysisResult.features)) {
      analysisResult.features.forEach((feature: any, index: number) => {
        tags.push({
          id: `feature_${index}_${Date.now()}`,
          category: this.defaultCategories.find(cat => cat.id === 'features')!,
          value: `${feature.type}: ${feature.condition}`,
          confidence: feature.confidence || 0.8,
          source: 'ai_analysis',
          metadata: { coordinates: feature.coordinates },
          timestamp: Date.now()
        });
      });
    }

    // Issue tags
    if (analysisResult.issues && Array.isArray(analysisResult.issues)) {
      analysisResult.issues.forEach((issue: any, index: number) => {
        tags.push({
          id: `issue_${index}_${Date.now()}`,
          category: this.defaultCategories.find(cat => cat.id === 'issues')!,
          value: `${issue.title} (${issue.severity})`,
          confidence: 0.8,
          source: 'ai_analysis',
          metadata: {
            severity: issue.severity,
            estimatedCost: issue.estimatedCost,
            priority: issue.priority
          },
          timestamp: Date.now()
        });
      });
    }

    // Market tags
    if (analysisResult.marketComparison) {
      tags.push({
        id: `market_${Date.now()}`,
        category: this.defaultCategories.find(cat => cat.id === 'market')!,
        value: `Market Trend: ${analysisResult.marketComparison.marketTrend}`,
        confidence: analysisResult.marketComparison.confidence || 0.7,
        source: 'calculated',
        timestamp: Date.now()
      });
    }

    return tags;
  }

  private async applyTaggingRules(
    propertyId: string,
    analysisResult: any,
    options: TaggingOptions
  ): Promise<PropertyTag[]> {
    const tags: PropertyTag[] = [];
    const customRules = options.customRules || this.defaultRules;

    for (const rule of customRules) {
      if (!rule.enabled) continue;

      const conditionsMet = this.evaluateConditions(rule.conditions, analysisResult);

      if (conditionsMet) {
        for (const action of rule.actions) {
          if (action.type === 'add_tag') {
            const category = this.defaultCategories.find(cat => cat.id === action.parameters.category);
            if (category) {
              tags.push({
                id: `rule_${rule.id}_${Date.now()}`,
                category,
                value: action.parameters.value,
                confidence: 0.9,
                source: 'calculated',
                metadata: { ruleId: rule.id },
                timestamp: Date.now()
              });
            }
          }
        }
      }
    }

    return tags;
  }

  private evaluateConditions(conditions: TaggingCondition[], data: any): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getNestedValue(data, condition.field);

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'between':
          const [min, max] = condition.value;
          return Number(fieldValue) >= min && Number(fieldValue) <= max;
        case 'regex':
          return new RegExp(condition.value).test(String(fieldValue));
        default:
          return false;
      }
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private mergeTags(tags: PropertyTag[]): PropertyTag[] {
    const merged = new Map<string, PropertyTag>();

    tags.forEach(tag => {
      const key = `${tag.category.id}:${tag.value}`;
      const existing = merged.get(key);

      if (!existing || tag.confidence > existing.confidence) {
        merged.set(key, tag);
      }
    });

    return Array.from(merged.values());
  }

  private filterByConfidence(tags: PropertyTag[], threshold: number): PropertyTag[] {
    return tags.filter(tag => tag.confidence >= threshold);
  }

  private limitTagsPerCategory(tags: PropertyTag[], maxPerCategory: number): PropertyTag[] {
    const categoryCounts = new Map<string, number>();
    const limited: PropertyTag[] = [];

    // Sort by confidence descending
    const sortedTags = tags.sort((a, b) => b.confidence - a.confidence);

    for (const tag of sortedTags) {
      const categoryId = tag.category.id;
      const currentCount = categoryCounts.get(categoryId) || 0;

      if (currentCount < maxPerCategory) {
        limited.push(tag);
        categoryCounts.set(categoryId, currentCount + 1);
      }
    }

    return limited;
  }

  private generateSummary(tags: PropertyTag[]): PropertyTags['summary'] {
    const categories: Record<string, number> = {};
    let totalConfidence = 0;

    tags.forEach(tag => {
      categories[tag.category.id] = (categories[tag.category.id] || 0) + 1;
      totalConfidence += tag.confidence;
    });

    return {
      totalTags: tags.length,
      categories,
      lastUpdated: Date.now(),
      confidence: tags.length > 0 ? totalConfidence / tags.length : 0
    };
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const tagsData = localStorage.getItem(this.STORAGE_KEY);
      const rulesData = localStorage.getItem(this.RULES_KEY);

      if (tagsData) {
        const parsed = JSON.parse(tagsData);
        Object.entries(parsed).forEach(([propertyId, propertyTags]) => {
          this.tagsCache.set(propertyId, propertyTags as PropertyTags);
        });
      }

      if (rulesData) {
        this.defaultRules = JSON.parse(rulesData);
      }
    } catch (error) {
      console.warn('[Property Tagging] Failed to load persisted data:', error);
    }
  }

  private async persistTags(propertyTags: PropertyTags): Promise<void> {
    try {
      const allTags = Object.fromEntries(this.tagsCache.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allTags));
    } catch (error) {
      console.warn('[Property Tagging] Failed to persist tags:', error);
    }
  }

  private async persistRules(): Promise<void> {
    try {
      localStorage.setItem(this.RULES_KEY, JSON.stringify(this.defaultRules));
    } catch (error) {
      console.warn('[Property Tagging] Failed to persist rules:', error);
    }
  }
}

// Export singleton instance
export const propertyTaggingService = new PropertyTaggingService();
export default propertyTaggingService;