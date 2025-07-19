/**
 * AI Component Types and Interfaces
 * Core types for AI-powered dashboard components
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type FeedbackType = 'positive' | 'negative';
export type LoadingVariant = 'spinner' | 'progress' | 'skeleton';
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * Base interface for AI-generated content
 */
export interface AIContent {
  id: string;
  content: string;
  confidence: number;
  timestamp: Date;
  explanation?: string;
}

/**
 * User feedback for AI suggestions
 */
export interface AIFeedback {
  type: FeedbackType;
  comment?: string;
  timestamp: Date;
  userId?: string;
}

/**
 * AI explanation data structure
 */
export interface AIExplanation {
  title: string;
  content: string;
  factors?: ExplanationFactor[];
  methodology?: string;
  limitations?: string[];
}

/**
 * Individual explanation factor
 */
export interface ExplanationFactor {
  name: string;
  value: any;
  weight: number;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

/**
 * Loading state information
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  estimatedTime?: number;
  progress?: number;
}

/**
 * AI suggestion with metadata
 */
export interface AISuggestion extends AIContent {
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  feedback?: AIFeedback[];
}

/**
 * Confidence score with contextual information
 */
export interface ConfidenceScore {
  value: number; // 0-100
  level: ConfidenceLevel;
  explanation?: string;
  factors?: string[];
}

/**
 * Props for AI-generated content wrapper
 */
export interface AIGeneratedContentProps {
  children: React.ReactNode;
  confidence?: number;
  explanation?: string | AIExplanation;
  onFeedback?: (feedback: AIFeedback) => void;
  variant?: 'outlined' | 'filled';
  showLabel?: boolean;
  className?: string;
}

/**
 * Props for explanation tooltip
 */
export interface ExplanationTooltipProps {
  title: string;
  content: string | AIExplanation;
  children: React.ReactNode;
  placement?: TooltipPlacement;
  maxWidth?: number;
  interactive?: boolean;
}

/**
 * Props for loading state indicator
 */
export interface LoadingStateIndicatorProps {
  message?: string;
  estimatedTime?: number;
  variant?: LoadingVariant;
  progress?: number;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Enhanced suggestion chip props
 */
export interface SuggestionChipProps {
  label: string;
  confidence?: number;
  onFeedback?: (feedback: AIFeedback) => Promise<void> | void;
  showFeedback?: boolean;
  variant?: 'outlined' | 'filled';
  size?: 'small' | 'medium';
}

/**
 * Enhanced confidence indicator props
 */
export interface ConfidenceIndicatorProps {
  confidence: number;
  showTooltip?: boolean;
  explanation?: string | AIExplanation;
  variant?: 'linear' | 'circular';
  size?: 'small' | 'medium' | 'large';
  colorCoded?: boolean;
  showNumericalScore?: boolean;
}