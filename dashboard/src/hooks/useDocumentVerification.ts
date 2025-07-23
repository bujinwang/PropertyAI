/**
 * React Query hooks for document verification service
 * Provides data fetching and caching for document verification status
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { documentVerificationService } from '../services/documentVerificationService';
import type {
  VerificationStatus,
  VerificationDocument,
  RequiredAction,
  VerificationStep
} from '../types/document-verification';

// ============================================================================
// Document Verification Hooks
// ============================================================================

export const useVerificationStatus = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.documentVerification.status(userId),
    queryFn: () => documentVerificationService.getVerificationStatus(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useVerificationDocuments = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.documentVerification.documents(userId),
    queryFn: () => documentVerificationService.getDocuments(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, file, documentType }: { 
      userId: string; 
      file: File; 
      documentType: string;
    }) => documentVerificationService.uploadDocument(userId, file, documentType),
    onMutate: async ({ userId, file, documentType }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.documentVerification.documents(userId) 
      });
      
      // Create optimistic document entry
      const optimisticDocument: VerificationDocument = {
        id: `temp-${Date.now()}`,
        type: documentType,
        name: file.name,
        status: 'uploading',
        uploadedAt: new Date(),
        size: file.size,
        mimeType: file.type,
      };
      
      // Optimistically add document
      queryClient.setQueryData(
        queryKeys.documentVerification.documents(userId),
        (old: VerificationDocument[] | undefined) => {
          if (!old) return [optimisticDocument];
          return [...old, optimisticDocument];
        }
      );
      
      return { optimisticDocument, userId };
    },
    onError: (err, variables, context) => {
      // Remove optimistic document on error
      if (context?.optimisticDocument && context?.userId) {
        queryClient.setQueryData(
          queryKeys.documentVerification.documents(context.userId),
          (old: VerificationDocument[] | undefined) => {
            if (!old) return old;
            return old.filter(doc => doc.id !== context.optimisticDocument.id);
          }
        );
      }
    },
    onSuccess: (uploadedDocument, { userId }, context) => {
      // Replace optimistic document with real document
      queryClient.setQueryData(
        queryKeys.documentVerification.documents(userId),
        (old: VerificationDocument[] | undefined) => {
          if (!old) return [uploadedDocument];
          return old.map(doc => 
            doc.id === context?.optimisticDocument.id ? uploadedDocument : doc
          );
        }
      );
      
      // Invalidate verification status to reflect new document
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.documentVerification.status(userId) 
      });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, documentId }: { userId: string; documentId: string }) =>
      documentVerificationService.deleteDocument(userId, documentId),
    onMutate: async ({ userId, documentId }) => {
      // Optimistically remove document
      queryClient.setQueryData(
        queryKeys.documentVerification.documents(userId),
        (old: VerificationDocument[] | undefined) => {
          if (!old) return old;
          return old.filter(doc => doc.id !== documentId);
        }
      );
    },
    onError: (err, { userId }) => {
      // Refetch on error to restore correct state
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.documentVerification.documents(userId) 
      });
    },
    onSuccess: (_, { userId }) => {
      // Invalidate verification status
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.documentVerification.status(userId) 
      });
    },
  });
};

export const useSubmitForVerification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => documentVerificationService.submitForVerification(userId),
    onMutate: async (userId) => {
      // Optimistically update status
      queryClient.setQueryData(
        queryKeys.documentVerification.status(userId),
        (old: VerificationStatus | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: 'submitted',
            currentStep: Math.min(old.currentStep + 1, old.totalSteps),
          };
        }
      );
    },
    onError: (err, userId) => {
      // Refetch on error
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.documentVerification.status(userId) 
      });
    },
    onSuccess: (_, userId) => {
      // Refetch to get updated status
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.documentVerification.status(userId) 
      });
    },
  });
};

export const useCompleteRequiredAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, actionId }: { userId: string; actionId: string }) =>
      documentVerificationService.completeRequiredAction(userId, actionId),
    onMutate: async ({ userId, actionId }) => {
      // Optimistically mark action as completed
      queryClient.setQueryData(
        queryKeys.documentVerification.status(userId),
        (old: VerificationStatus | undefined) => {
          if (!old) return old;
          return {
            ...old,
            requiredActions: old.requiredActions.map(action =>
              action.id === actionId 
                ? { ...action, completed: true, completedAt: new Date() }
                : action
            ),
          };
        }
      );
    },
    onError: (err, { userId }) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.documentVerification.status(userId) 
      });
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.documentVerification.status(userId) 
      });
    },
  });
};

export const useRequestReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, message }: { userId: string; message?: string }) =>
      documentVerificationService.requestReview(userId, message),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.documentVerification.status(userId) 
      });
    },
  });
};

// ============================================================================
// Utility Hooks
// ============================================================================

export const useVerificationProgress = (userId: string) => {
  const { data: status } = useVerificationStatus(userId);
  
  if (!status) return { progress: 0, isComplete: false };
  
  const progress = (status.currentStep / status.totalSteps) * 100;
  const isComplete = status.status === 'verified';
  
  return { progress, isComplete, status };
};

export const useRequiredActions = (userId: string) => {
  const { data: status } = useVerificationStatus(userId);
  
  const pendingActions = status?.requiredActions.filter(action => !action.completed) || [];
  const completedActions = status?.requiredActions.filter(action => action.completed) || [];
  
  return {
    pendingActions,
    completedActions,
    totalActions: status?.requiredActions.length || 0,
    hasPendingActions: pendingActions.length > 0,
  };
};

export const useDocumentsByType = (userId: string) => {
  const { data: documents } = useVerificationDocuments(userId);
  
  const documentsByType = documents?.reduce((acc, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = [];
    }
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<string, VerificationDocument[]>) || {};
  
  return documentsByType;
};

export const usePrefetchVerificationData = () => {
  const queryClient = useQueryClient();
  
  return (userId: string) => {
    // Prefetch verification status
    queryClient.prefetchQuery({
      queryKey: queryKeys.documentVerification.status(userId),
      queryFn: () => documentVerificationService.getVerificationStatus(userId),
      staleTime: 2 * 60 * 1000,
    });
    
    // Prefetch documents
    queryClient.prefetchQuery({
      queryKey: queryKeys.documentVerification.documents(userId),
      queryFn: () => documentVerificationService.getDocuments(userId),
      staleTime: 1 * 60 * 1000,
    });
  };
};