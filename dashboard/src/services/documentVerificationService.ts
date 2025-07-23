/**
 * Document Verification Service
 * Handles API calls and data management for document verification
 */

import { VerificationState, RequiredAction, VerificationDocument, VerificationStep } from '../types/document-verification';

// Mock data for demonstration - in real implementation, this would come from API
const mockVerificationState: VerificationState = {
  currentStep: 2,
  totalSteps: 4,
  status: 'in_review',
  estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
  confidence: 78,
  lastUpdated: new Date(),
  requiredActions: [
    {
      id: '1',
      description: 'Provide clearer photo of government ID - current image appears blurry',
      priority: 'high',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      completed: false,
      aiGenerated: true,
      confidence: 85,
      explanation: 'AI analysis detected low image quality that may affect verification accuracy'
    },
    {
      id: '2', 
      description: 'Submit recent bank statement (within last 30 days)',
      priority: 'medium',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      completed: false,
      aiGenerated: false
    },
    {
      id: '3',
      description: 'Verify employment details with HR department',
      priority: 'low',
      completed: true,
      aiGenerated: false
    }
  ],
  documents: [
    {
      id: '1',
      type: 'income_proof',
      name: 'Pay Stub - December 2024',
      status: 'verified',
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      confidence: 92,
      aiAnalysis: 'Document appears authentic with consistent formatting and valid employer information'
    },
    {
      id: '2',
      type: 'government_id',
      name: 'Driver License',
      status: 'in_review',
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      confidence: 65,
      aiAnalysis: 'Image quality is suboptimal, affecting confidence in verification'
    },
    {
      id: '3',
      type: 'reference_letter',
      name: 'Reference Letter - Previous Landlord',
      status: 'rejected',
      uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      confidence: 25,
      rejectionReason: 'Letter format does not match standard requirements',
      aiAnalysis: 'Document format inconsistent with typical reference letter structure'
    }
  ]
};

const mockVerificationSteps: VerificationStep[] = [
  {
    id: 1,
    title: 'Document Submission',
    description: 'Upload required documents',
    completed: true,
    active: false,
    confidence: 100
  },
  {
    id: 2,
    title: 'AI Analysis',
    description: 'Automated document verification',
    completed: false,
    active: true,
    confidence: 78
  },
  {
    id: 3,
    title: 'Manual Review',
    description: 'Human verification of flagged items',
    completed: false,
    active: false
  },
  {
    id: 4,
    title: 'Final Approval',
    description: 'Complete verification process',
    completed: false,
    active: false
  }
];

/**
 * Get current verification state
 */
export const getVerificationState = async (): Promise<VerificationState> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockVerificationState;
};

/**
 * Get verification steps
 */
export const getVerificationSteps = async (): Promise<VerificationStep[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockVerificationSteps;
};

/**
 * Update required action status
 */
export const updateRequiredAction = async (actionId: string, completed: boolean): Promise<RequiredAction> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const action = mockVerificationState.requiredActions.find(a => a.id === actionId);
  if (!action) {
    throw new Error('Action not found');
  }
  
  action.completed = completed;
  return action;
};

/**
 * Submit additional document
 */
export const submitDocument = async (file: File, type: string): Promise<VerificationDocument> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newDocument: VerificationDocument = {
    id: Date.now().toString(),
    type: type as any,
    name: file.name,
    status: 'submitted',
    uploadedAt: new Date(),
    confidence: 0
  };
  
  mockVerificationState.documents.push(newDocument);
  return newDocument;
};