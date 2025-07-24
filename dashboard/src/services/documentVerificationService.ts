/**
 * Document Verification Service
 * Handles API calls and data management for document verification
 */

import { 
  VerificationState, 
  RequiredAction, 
  VerificationDocument, 
  VerificationStep,
  DocumentSubmissionResponse,
  DocumentAnalysisResult
} from '../types/document-verification';
import { apiService } from './api';

/**
 * Get current verification state for a tenant
 */
export const getVerificationState = async (tenantId: string): Promise<VerificationState> => {
  try {
    const response = await apiService.get(`/api/verification/${tenantId}/state`);
    return response.data;
  } catch (error) {
    console.error('Error fetching verification state:', error);
    throw new Error('Failed to fetch verification state');
  }
};

/**
 * Get verification steps for a tenant
 */
export const getVerificationSteps = async (tenantId: string): Promise<VerificationStep[]> => {
  try {
    const response = await apiService.get(`/api/verification/${tenantId}/steps`);
    return response.data;
  } catch (error) {
    console.error('Error fetching verification steps:', error);
    throw new Error('Failed to fetch verification steps');
  }
};

/**
 * Update required action status
 */
export const updateRequiredAction = async (
  tenantId: string,
  actionId: string,
  completed: boolean
): Promise<RequiredAction> => {
  try {
    const response = await apiService.put(`/api/verification/${tenantId}/actions/${actionId}`, {
      completed
    });
    return response.data;
  } catch (error) {
    console.error('Error updating required action:', error);
    throw new Error('Failed to update required action');
  }
};

/**
 * Submit additional document
 */
export const submitDocument = async (
  tenantId: string,
  file: File,
  type: string,
  metadata?: Record<string, any>
): Promise<DocumentSubmissionResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await apiService.post(`/api/verification/${tenantId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting document:', error);
    throw new Error('Failed to submit document');
  }
};

/**
 * Get document analysis results
 */
export const getDocumentAnalysis = async (
  tenantId: string,
  documentId: string
): Promise<DocumentAnalysisResult> => {
  try {
    const response = await apiService.get(`/api/verification/${tenantId}/documents/${documentId}/analysis`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document analysis:', error);
    throw new Error('Failed to fetch document analysis');
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (
  tenantId: string,
  documentId: string
): Promise<void> => {
  try {
    await apiService.delete(`/api/verification/${tenantId}/documents/${documentId}`);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error('Failed to delete document');
  }
};

/**
 * Re-analyze a document
 */
export const reanalyzeDocument = async (
  tenantId: string,
  documentId: string
): Promise<DocumentAnalysisResult> => {
  try {
    const response = await apiService.post(`/api/verification/${tenantId}/documents/${documentId}/reanalyze`);
    return response.data;
  } catch (error) {
    console.error('Error re-analyzing document:', error);
    throw new Error('Failed to re-analyze document');
  }
};

/**
 * Get verification history
 */
export const getVerificationHistory = async (
  tenantId: string,
  limit?: number,
  offset?: number
): Promise<{
  history: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
    details: Record<string, any>;
  }>;
  total: number;
}> => {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await apiService.get(`/api/verification/${tenantId}/history?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching verification history:', error);
    throw new Error('Failed to fetch verification history');
  }
};

/**
 * Request manual review
 */
export const requestManualReview = async (
  tenantId: string,
  reason: string,
  priority?: 'low' | 'medium' | 'high'
): Promise<void> => {
  try {
    await apiService.post(`/api/verification/${tenantId}/review-request`, {
      reason,
      priority: priority || 'medium'
    });
  } catch (error) {
    console.error('Error requesting manual review:', error);
    throw new Error('Failed to request manual review');
  }
};

/**
 * Get verification statistics
 */
export const getVerificationStats = async (
  tenantId: string
): Promise<{
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  averageProcessingTime: number;
  completionPercentage: number;
}> => {
  try {
    const response = await apiService.get(`/api/verification/${tenantId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    throw new Error('Failed to fetch verification stats');
  }
};

/**
 * Download document
 */
export const downloadDocument = async (
  tenantId: string,
  documentId: string
): Promise<Blob> => {
  try {
    const response = await apiService.get(`/api/verification/${tenantId}/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading document:', error);
    throw new Error('Failed to download document');
  }
};

/**
 * Get document templates
 */
export const getDocumentTemplates = async (): Promise<Array<{
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSize: number;
}>> => {
  try {
    const response = await apiService.get('/api/verification/templates');
    return response.data;
  } catch (error) {
    console.error('Error fetching document templates:', error);
    throw new Error('Failed to fetch document templates');
  }
};

/**
 * Check verification eligibility
 */
export const checkVerificationEligibility = async (
  tenantId: string
): Promise<{
  eligible: boolean;
  reasons: string[];
  nextSteps: string[];
}> => {
  try {
    const response = await apiService.get(`/api/verification/${tenantId}/eligibility`);
    return response.data;
  } catch (error) {
    console.error('Error checking verification eligibility:', error);
    throw new Error('Failed to check verification eligibility');
  }
};