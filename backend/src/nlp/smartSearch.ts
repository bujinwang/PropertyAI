import * as natural from 'natural';
import { prisma } from '../config/database';

interface SearchResult {
  id: string;
  type: 'property' | 'tenant' | 'maintenance' | 'transaction';
  title: string;
  description: string;
  relevanceScore: number;
  metadata: any;
}

interface SmartSearchQuery {
  query: string;
  filters?: {
    type?: string[];
    dateRange?: { start: Date; end: Date };
    propertyId?: string;
    tenantId?: string;
  };
  limit?: number;
}

class SmartSearchService {
  private tokenizer = new natural.WordTokenizer();
  private stemmer = natural.PorterStemmer;
  private tfidf = new natural.TfIdf();

  /**
   * Perform intelligent search across multiple data sources
   */
  async smartSearch(searchQuery: SmartSearchQuery): Promise<SearchResult[]> {
    const { query, filters = {}, limit = 20 } = searchQuery;

    // Tokenize and process the query
    const tokens = this.preprocessQuery(query);
    const stemmedTokens = tokens.map(token => this.stemmer.stem(token));

    const results: SearchResult[] = [];

    // Search across different data sources
    const propertyResults = await this.searchProperties(stemmedTokens, filters);
    const tenantResults = await this.searchTenants(stemmedTokens, filters);
    const maintenanceResults = await this.searchMaintenanceRequests(stemmedTokens, filters);
    const transactionResults = await this.searchTransactions(stemmedTokens, filters);

    // Combine and rank results
    results.push(...propertyResults);
    results.push(...tenantResults);
    results.push(...maintenanceResults);
    results.push(...transactionResults);

    // Sort by relevance score and apply limit
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results.slice(0, limit);
  }

  /**
   * Preprocess search query
   */
  private preprocessQuery(query: string): string[] {
    // Tokenize
    const tokens = this.tokenizer.tokenize(query.toLowerCase()) || [];

    // Remove stop words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can']);
    const filteredTokens = tokens.filter(token => !stopWords.has(token) && token.length > 2);

    return filteredTokens;
  }

  /**
   * Search properties
   */
  private async searchProperties(tokens: string[], filters: any): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      const properties = await prisma.property.findMany({
        where: filters.propertyId ? { id: filters.propertyId } : {},
        include: {
          units: {
            include: {
              tenant: true,
              maintenanceRequests: true,
            },
          },
        },
      });

      for (const property of properties) {
        const searchableText = `${property.address} ${property.city} ${property.state} ${property.zipCode}`.toLowerCase();
        const score = this.calculateRelevanceScore(tokens, searchableText);

        if (score > 0) {
          results.push({
            id: property.id,
            type: 'property',
            title: property.address,
            description: `${property.city}, ${property.state} ${property.zipCode}`,
            relevanceScore: score,
            metadata: {
              unitCount: property.units.length,
              occupancyRate: property.units.filter(u => u.tenant).length / property.units.length,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error searching properties:', error);
    }

    return results;
  }

  /**
   * Search tenants
   */
  private async searchTenants(tokens: string[], filters: any): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      const tenants = await prisma.tenant.findMany({
        where: filters.tenantId ? { id: filters.tenantId } : {},
        include: {
          unit: {
            include: {
              property: true,
            },
          },
        },
      });

      for (const tenant of tenants) {
        const searchableText = `${tenant.firstName} ${tenant.lastName} ${tenant.email}`.toLowerCase();
        const score = this.calculateRelevanceScore(tokens, searchableText);

        if (score > 0) {
          results.push({
            id: tenant.id,
            type: 'tenant',
            title: `${tenant.firstName} ${tenant.lastName}`,
            description: tenant.email,
            relevanceScore: score,
            metadata: {
              property: tenant.unit?.property?.address,
              unitNumber: tenant.unit?.unitNumber,
              moveInDate: tenant.moveInDate,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error searching tenants:', error);
    }

    return results;
  }

  /**
   * Search maintenance requests
   */
  private async searchMaintenanceRequests(tokens: string[], filters: any): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      const maintenanceRequests = await prisma.maintenanceRequest.findMany({
        where: {
          ...(filters.dateRange && {
            createdAt: {
              gte: filters.dateRange.start,
              lte: filters.dateRange.end,
            },
          }),
        },
        include: {
          unit: {
            include: {
              property: true,
              tenant: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      for (const request of maintenanceRequests) {
        const searchableText = `${request.title} ${request.description} ${request.category}`.toLowerCase();
        const score = this.calculateRelevanceScore(tokens, searchableText);

        if (score > 0) {
          results.push({
            id: request.id,
            type: 'maintenance',
            title: request.title,
            description: request.description,
            relevanceScore: score,
            metadata: {
              category: request.category,
              priority: request.priority,
              status: request.status,
              property: request.unit?.property?.address,
              tenant: request.unit?.tenant ? `${request.unit.tenant.firstName} ${request.unit.tenant.lastName}` : null,
              createdAt: request.createdAt,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error searching maintenance requests:', error);
    }

    return results;
  }

  /**
   * Search transactions
   */
  private async searchTransactions(tokens: string[], filters: any): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          ...(filters.dateRange && {
            createdAt: {
              gte: filters.dateRange.start,
              lte: filters.dateRange.end,
            },
          }),
        },
        include: {
          property: true,
          tenant: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      for (const transaction of transactions) {
        const searchableText = `${transaction.description} ${transaction.category} ${transaction.type}`.toLowerCase();
        const score = this.calculateRelevanceScore(tokens, searchableText);

        if (score > 0) {
          results.push({
            id: transaction.id,
            type: 'transaction',
            title: `${transaction.type}: $${transaction.amount}`,
            description: transaction.description,
            relevanceScore: score,
            metadata: {
              amount: transaction.amount,
              type: transaction.type,
              category: transaction.category,
              property: transaction.property?.address,
              tenant: transaction.tenant ? `${transaction.tenant.firstName} ${transaction.tenant.lastName}` : null,
              createdAt: transaction.createdAt,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error searching transactions:', error);
    }

    return results;
  }

  /**
   * Calculate relevance score based on token matching
   */
  private calculateRelevanceScore(tokens: string[], text: string): number {
    let score = 0;
    const textLower = text.toLowerCase();

    for (const token of tokens) {
      // Exact match gets highest score
      if (textLower.includes(token)) {
        score += 1.0;
      }

      // Partial match gets lower score
      const partialMatches = textLower.split(' ').filter(word => word.includes(token));
      score += partialMatches.length * 0.5;

      // Stemmed match gets medium score
      const stemmedToken = this.stemmer.stem(token);
      if (textLower.includes(stemmedToken)) {
        score += 0.7;
      }
    }

    // Boost score for multiple matches
    if (score > 1) {
      score *= 1.2;
    }

    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    const tokens = this.preprocessQuery(query);

    if (tokens.length === 0) {
      return [];
    }

    const suggestions: string[] = [];

    // Get common property types
    if (tokens.some(token => ['apartment', 'house', 'condo', 'townhouse'].includes(token))) {
      suggestions.push('Find properties by type');
    }

    // Get common maintenance categories
    if (tokens.some(token => ['plumbing', 'electrical', 'hvac', 'repair'].includes(token))) {
      suggestions.push('Search maintenance requests');
    }

    // Get common transaction types
    if (tokens.some(token => ['rent', 'payment', 'income', 'expense'].includes(token))) {
      suggestions.push('Find financial transactions');
    }

    // Get tenant-related searches
    if (tokens.some(token => ['tenant', 'lease', 'occupant'].includes(token))) {
      suggestions.push('Search tenant information');
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(): Promise<any> {
    // This would track search patterns and popular queries
    // For now, return mock data
    return {
      totalSearches: 1250,
      popularQueries: [
        { query: 'maintenance request', count: 45 },
        { query: 'tenant payment', count: 38 },
        { query: 'property address', count: 32 },
        { query: 'rent due', count: 28 },
      ],
      averageResults: 12.5,
      searchSuccessRate: 0.87,
    };
  }
}

export const smartSearchService = new SmartSearchService();