import axios from 'axios';
import { ElMessage } from 'element-plus';

// File upload related type definitions
export interface FileUploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface FileUploadResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

// Define axios response type
interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

// File type mappings
export const FILE_TYPE_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/zip': 'zip',
  'application/x-rar-compressed': 'rar',
  'video/mp4': 'mp4',
  'video/avi': 'avi',
  'video/quicktime': 'mov',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
} as const;

export const MIME_TYPE_MAP = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  'mp4': 'video/mp4',
  'avi': 'video/avi',
  'mov': 'video/quicktime',
  'mp3': 'audio/mp3',
  'wav': 'audio/wav',
} as const;

export const FILE_CATEGORY_MAP = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  document: ['pdf', 'doc', 'docx', 'txt'],
  spreadsheet: ['xls', 'xlsx', 'csv'],
  video: ['mp4', 'avi', 'mov'],
  audio: ['mp3', 'wav'],
  archive: ['zip', 'rar'],
} as const;

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string {
  return FILE_TYPE_MAP[mimeType as keyof typeof FILE_TYPE_MAP] || 'unknown';
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(extension: string): string {
  return MIME_TYPE_MAP[extension.toLowerCase() as keyof typeof MIME_TYPE_MAP] || 'application/octet-stream';
}

/**
 * Get file category from extension
 */
export function getFileCategory(extension: string): string {
  const ext = extension.toLowerCase();
  for (const [category, extensions] of Object.entries(FILE_CATEGORY_MAP)) {
    if ((extensions as readonly string[]).includes(ext)) {
      return category;
    }
  }
  return 'other';
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  const extension = getFileExtension(file.type);
  return allowedTypes.includes(extension) || allowedTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Custom file upload function
 */
export async function customRequest(
  file: File,
  uploadUrl: string,
  options: FileUploadOptions = {}
): Promise<FileUploadResponse> {
  const {
    onProgress,
    onSuccess,
    onError,
    headers = {},
    timeout = 30000,
  } = options;

  try {
    // Validate file
    if (!file) {
      throw new Error('No file selected');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Upload configuration
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...headers,
      },
      timeout,
      onUploadProgress: (progressEvent: ProgressEvent) => {
        if (progressEvent.total && progressEvent.loaded) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percentage);
        }
      },
    };

    // Make the request
    const response: AxiosResponse = await axios.post(uploadUrl, formData, config);

    // Handle success
    const result: FileUploadResponse = {
      success: true,
      data: response.data,
      message: response.data?.message || 'File uploaded successfully',
    };

    onSuccess?.(result);
    ElMessage.success(result.message);

    return result;

  } catch (error: any) {
    // Handle error
    const errorMessage = error.response?.data?.message ||
                        error.message ||
                        'File upload failed';

    const result: FileUploadResponse = {
      success: false,
      error: errorMessage,
    };

    onError?.(error);
    ElMessage.error(errorMessage);

    return result;
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  uploadUrl: string,
  options: FileUploadOptions = {}
): Promise<FileUploadResponse[]> {
  const uploadPromises = files.map(file => customRequest(file, uploadUrl, options));
  return Promise.all(uploadPromises);
}

/**
 * Upload file with retry mechanism
 */
export async function uploadFileWithRetry(
  file: File,
  uploadUrl: string,
  maxRetries: number = 3,
  options: FileUploadOptions = {}
): Promise<FileUploadResponse> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await customRequest(file, uploadUrl, {
        ...options,
        headers: {
          ...options.headers,
          'X-Retry-Attempt': attempt.toString(),
        },
      });
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}