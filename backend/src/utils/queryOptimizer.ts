import { Prisma } from '@prisma/client';
import { logger } from './logger';

/**
 * Query optimization utilities for Prisma
 */

/**
 * Pagination helper with default values
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function getPagination(options: PaginationOptions = {}): PaginationResult {
  const page = Math.max(1, options.page || 1);
  const maxLimit = options.maxLimit || 100;
  const limit = Math.min(options.limit || 10, maxLimit);
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    page,
    limit,
  };
}

/**
 * Build pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Cursor-based pagination helper
 */
export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  maxLimit?: number;
}

export interface CursorPaginationResult {
  cursor?: { id: string };
  take: number;
  skip?: number;
}

export function getCursorPagination(
  options: CursorPaginationOptions = {}
): CursorPaginationResult {
  const maxLimit = options.maxLimit || 100;
  const take = Math.min(options.limit || 10, maxLimit);

  const result: CursorPaginationResult = {
    take: take + 1, // Fetch one extra to determine if there's a next page
  };

  if (options.cursor) {
    result.cursor = { id: options.cursor };
    result.skip = 1; // Skip the cursor itself
  }

  return result;
}

/**
 * Search query builder with fuzzy matching
 */
export function buildSearchQuery(
  searchTerm: string,
  fields: string[]
): Prisma.StringFilter[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }

  const term = searchTerm.trim();
  
  return fields.map((field) => ({
    [field]: {
      contains: term,
      mode: 'insensitive' as Prisma.QueryMode,
    },
  })) as any;
}

/**
 * Build OR condition for search across multiple fields
 */
export function buildSearchCondition(
  searchTerm: string,
  fields: string[]
): { OR: any[] } | {} {
  if (!searchTerm || searchTerm.trim() === '') {
    return {};
  }

  const term = searchTerm.trim();
  
  const conditions = fields.map((field) => {
    const parts = field.split('.');
    if (parts.length === 1) {
      // Simple field
      return {
        [field]: {
          contains: term,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      };
    } else {
      // Nested field (e.g., "user.name")
      const [relation, nestedField] = parts;
      return {
        [relation]: {
          [nestedField]: {
            contains: term,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        },
      };
    }
  });

  return { OR: conditions };
}

/**
 * Date range filter builder
 */
export interface DateRangeOptions {
  from?: string | Date;
  to?: string | Date;
}

export function buildDateRangeFilter(
  options: DateRangeOptions
): Prisma.DateTimeFilter | undefined {
  if (!options.from && !options.to) {
    return undefined;
  }

  const filter: Prisma.DateTimeFilter = {};

  if (options.from) {
    filter.gte = new Date(options.from);
  }

  if (options.to) {
    filter.lte = new Date(options.to);
  }

  return filter;
}

/**
 * Sorting helper
 */
export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function buildSortOrder(
  options: SortOptions = {},
  defaultSort: string = 'createdAt'
): any {
  const sortBy = options.sortBy || defaultSort;
  const sortOrder = options.sortOrder || 'desc';

  // Handle nested sorting (e.g., "user.name")
  const parts = sortBy.split('.');
  if (parts.length === 1) {
    return { [sortBy]: sortOrder };
  } else {
    const [relation, field] = parts;
    return {
      [relation]: {
        [field]: sortOrder,
      },
    };
  }
}

/**
 * Build filter conditions from query parameters
 */
export interface FilterOptions {
  [key: string]: any;
}

export function buildFilters(
  options: FilterOptions,
  allowedFields: string[]
): any {
  const filters: any = {};

  for (const field of allowedFields) {
    if (options[field] !== undefined && options[field] !== null && options[field] !== '') {
      // Handle array values (e.g., status=ACTIVE,PENDING)
      if (typeof options[field] === 'string' && options[field].includes(',')) {
        filters[field] = {
          in: options[field].split(','),
        };
      } else {
        filters[field] = options[field];
      }
    }
  }

  return filters;
}

/**
 * Performance monitoring decorator
 */
export function MonitorQuery(threshold: number = 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - start;

      if (duration > threshold) {
        logger.warn(
          `Slow query detected: ${target.constructor.name}.${propertyKey} took ${duration}ms`
        );
      } else {
        logger.debug(
          `Query: ${target.constructor.name}.${propertyKey} took ${duration}ms`
        );
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Batch loading helper to avoid N+1 queries
 */
export async function batchLoad<T, K extends keyof T>(
  items: T[],
  foreignKey: K,
  loader: (ids: T[K][]) => Promise<any[]>,
  localKey: keyof T = 'id' as keyof T
): Promise<T[]> {
  if (items.length === 0) {
    return items;
  }

  // Extract unique foreign keys
  const foreignKeys = [...new Set(items.map((item) => item[foreignKey]))];

  // Load related data in batch
  const relatedData = await loader(foreignKeys);

  // Create lookup map
  const lookup = new Map();
  relatedData.forEach((data) => {
    lookup.set(data[localKey], data);
  });

  // Attach related data to items
  return items.map((item) => ({
    ...item,
    related: lookup.get(item[foreignKey]),
  }));
}

/**
 * Select fields helper to reduce data transfer
 */
export function buildSelect(
  fields?: string[]
): { [key: string]: boolean } | undefined {
  if (!fields || fields.length === 0) {
    return undefined;
  }

  const select: { [key: string]: boolean } = {};
  
  fields.forEach((field) => {
    // Handle nested selections (e.g., "user.name")
    const parts = field.split('.');
    if (parts.length === 1) {
      select[field] = true;
    } else {
      const [relation, nestedField] = parts;
      if (!select[relation]) {
        select[relation] = { select: {} };
      }
      (select[relation] as any).select[nestedField] = true;
    }
  });

  return select;
}

/**
 * Aggregate helper for common aggregations
 */
export interface AggregateOptions {
  count?: boolean;
  sum?: string[];
  avg?: string[];
  min?: string[];
  max?: string[];
}

export function buildAggregate(options: AggregateOptions): any {
  const aggregate: any = {};

  if (options.count) {
    aggregate._count = true;
  }

  if (options.sum && options.sum.length > 0) {
    aggregate._sum = {};
    options.sum.forEach((field) => {
      aggregate._sum[field] = true;
    });
  }

  if (options.avg && options.avg.length > 0) {
    aggregate._avg = {};
    options.avg.forEach((field) => {
      aggregate._avg[field] = true;
    });
  }

  if (options.min && options.min.length > 0) {
    aggregate._min = {};
    options.min.forEach((field) => {
      aggregate._min[field] = true;
    });
  }

  if (options.max && options.max.length > 0) {
    aggregate._max = {};
    options.max.forEach((field) => {
      aggregate._max[field] = true;
    });
  }

  return aggregate;
}

/**
 * Transaction helper with retry logic
 */
export async function transactionWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable (e.g., deadlock, connection error)
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('deadlock') ||
          error.message.includes('connection') ||
          error.message.includes('timeout'));

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      logger.warn(
        `Transaction failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Soft delete helper
 */
export interface SoftDeleteOptions {
  where: any;
  data?: any;
}

export function buildSoftDelete(options: SoftDeleteOptions): any {
  return {
    where: options.where,
    data: {
      ...options.data,
      deletedAt: new Date(),
      isDeleted: true,
    },
  };
}

/**
 * Include non-deleted records in queries
 */
export function excludeDeleted(): { deletedAt: null } {
  return { deletedAt: null };
}

/**
 * Query builder class for complex queries
 */
export class QueryBuilder<T> {
  private query: any = {};

  where(conditions: any): this {
    this.query.where = { ...this.query.where, ...conditions };
    return this;
  }

  include(relations: any): this {
    this.query.include = { ...this.query.include, ...relations };
    return this;
  }

  select(fields: any): this {
    this.query.select = fields;
    return this;
  }

  orderBy(sort: any): this {
    this.query.orderBy = sort;
    return this;
  }

  paginate(pagination: PaginationResult): this {
    this.query.skip = pagination.skip;
    this.query.take = pagination.take;
    return this;
  }

  search(term: string, fields: string[]): this {
    const searchCondition = buildSearchCondition(term, fields);
    if (Object.keys(searchCondition).length > 0) {
      this.query.where = {
        ...this.query.where,
        ...searchCondition,
      };
    }
    return this;
  }

  dateRange(field: string, options: DateRangeOptions): this {
    const filter = buildDateRangeFilter(options);
    if (filter) {
      this.query.where = {
        ...this.query.where,
        [field]: filter,
      };
    }
    return this;
  }

  build(): any {
    return this.query;
  }
}
