/**
 * Document Verification Types and Interfaces
 */

export type VerificationStatus = 'submitted' | 'in_review' | 'verified' | 'rejected';
export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';
export type DocumentType = 'income_proof' | 'government_id' | 'reference_letter' | 'bank_statement' | 'employment_letter' | 'other';

/**
 * Required action for document verification
 */
export interface RequiredAction {
  id: string;
  description: string;
  priority: ActionPriority;
  dueDate?: Date;
  completed: boolean;
  aiGenerated: boolean;
  confidence?: number;
  explanation?: string;
}

/**
 * Document verification item
 */
export interface VerificationDocument {
  id: string;
  type: DocumentType;
  name: string;
  status: VerificationStatus;
  uploadedAt: Date;
  reviewedAt?: Date;
  confidence?: number;
  aiAnalysis?: string;
  rejectionReason?: string;
}

/**
 * Overall verification state
 */
export interface VerificationState {
  currentStep: number;
  totalSteps: number;
  status: VerificationStatus;
  estimatedCompletion: Date;
  confidence: number;
  requiredActions: RequiredAction[];
  documents: VerificationDocument[];
  lastUpdated: Date;
}

/**
 * Verification step information
 */
export interface VerificationStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
  confidence?: number;
}