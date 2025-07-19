/**
 * AI Communication Training Types
 * Types and interfaces for the AI Communication Training feature
 */

export type ResponseTrigger = 
  | 'after_hours'
  | 'common_questions'
  | 'maintenance_requests'
  | 'payment_inquiries'
  | 'lease_questions'
  | 'emergency_situations';

export type EscalationCondition = 
  | 'no_response_after_time'
  | 'negative_sentiment'
  | 'complex_request'
  | 'specific_keywords'
  | 'multiple_attempts';

export type CommunicationTone = 'formal' | 'friendly' | 'casual';
export type CommunicationStyle = 'concise' | 'detailed' | 'empathetic';

export type TemplateStatus = 'pending' | 'approved' | 'rejected' | 'draft';
export type ScenarioStatus = 'active' | 'inactive' | 'testing';

/**
 * Escalation rule configuration
 */
export interface EscalationRule {
  id: string;
  condition: EscalationCondition;
  threshold: number; // minutes for time-based, score for sentiment-based
  action: 'escalate_to_human' | 'notify_manager' | 'create_ticket';
  priority: 'low' | 'medium' | 'high';
  enabled: boolean;
}

/**
 * Response settings configuration
 */
export interface ResponseSettings {
  triggers: ResponseTrigger[];
  delayMinutes: number;
  escalationRules: EscalationRule[];
  maxAttempts: number;
  businessHoursOnly: boolean;
}

/**
 * Communication scenario
 */
export interface CommunicationScenario {
  id: string;
  title: string;
  description: string;
  category: string;
  trigger: ResponseTrigger;
  aiSuggestion: string;
  confidence: number;
  status: ScenarioStatus;
  lastUpdated: Date;
  examples: string[];
}

/**
 * Tone and style configuration
 */
export interface ToneStyleConfig {
  tone: CommunicationTone;
  style: CommunicationStyle;
  customInstructions?: string;
  examples: {
    [key in CommunicationTone]: {
      [key in CommunicationStyle]: string;
    };
  };
}

/**
 * Default examples for tone and style combinations
 */
export const DEFAULT_TONE_STYLE_EXAMPLES: ToneStyleConfig['examples'] = {
  formal: {
    concise: 'Request received. Maintenance scheduled for tomorrow 2-4 PM.',
    detailed: 'Thank you for contacting us regarding your maintenance request. We have received your request for the leaky faucet repair in your kitchen. Our maintenance team will contact you within 24 hours to schedule a convenient appointment time. The typical repair duration is 1-2 hours, and we will ensure minimal disruption to your daily routine.',
    empathetic: 'Thank you for bringing this maintenance issue to our attention. We understand how inconvenient a leaky faucet can be, and we want to assure you that we will address this matter promptly and professionally.'
  },
  friendly: {
    concise: 'Hi! Got your request - we\'ll get someone over to fix that tomorrow between 2-4 PM.',
    detailed: 'Hi there! Thanks for reaching out about the leaky faucet in your kitchen. We\'ve got your maintenance request and we\'ll take care of it soon. Our maintenance team will give you a call within 24 hours to set up a time that works for you. Usually takes about 1-2 hours to fix, and we\'ll make sure to work around your schedule.',
    empathetic: 'Hi there! I completely understand how frustrating a leaky faucet can be - it\'s one of those things that just gets more annoying by the day. We\'ll make sure to get this fixed for you as quickly as possible so you can get back to your normal routine.'
  },
  casual: {
    concise: 'Hey! Maintenance request received - someone will be over tomorrow 2-4 PM to fix it.',
    detailed: 'Hey! Got your maintenance request for the kitchen faucet. No worries, we\'ll get someone over to take care of that for you. Our maintenance guy will reach out within the next day or so to figure out a good time. Should only take an hour or two to get it sorted out.',
    empathetic: 'Hey! That leaky faucet sounds super annoying - I totally get it. We\'ll get someone over there ASAP to fix it up for you. Nobody wants to deal with that constant dripping!'
  }
};

/**
 * Template for approval workflow
 */
export interface CommunicationTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  trigger: ResponseTrigger;
  status: TemplateStatus;
  createdBy: string;
  createdAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComments?: string;
  confidence: number;
}

/**
 * Training state for the entire screen
 */
export interface CommunicationTrainingState {
  responseSettings: ResponseSettings;
  scenarios: CommunicationScenario[];
  toneStyle: ToneStyleConfig;
  pendingTemplates: CommunicationTemplate[];
  isLoading: boolean;
  error?: string;
}

/**
 * Preview configuration for real-time preview
 */
export interface PreviewConfig {
  scenario: string;
  tone: CommunicationTone;
  style: CommunicationStyle;
  triggers: ResponseTrigger[];
  delay: number;
}

/**
 * Response trigger options for UI
 */
export const RESPONSE_TRIGGER_OPTIONS: Array<{
  value: ResponseTrigger;
  label: string;
  description: string;
}> = [
  {
    value: 'after_hours',
    label: 'After Hours',
    description: 'Respond to messages received outside business hours'
  },
  {
    value: 'common_questions',
    label: 'Common Questions',
    description: 'Handle frequently asked questions automatically'
  },
  {
    value: 'maintenance_requests',
    label: 'Maintenance Requests',
    description: 'Process and acknowledge maintenance requests'
  },
  {
    value: 'payment_inquiries',
    label: 'Payment Inquiries',
    description: 'Respond to rent payment and billing questions'
  },
  {
    value: 'lease_questions',
    label: 'Lease Questions',
    description: 'Answer questions about lease terms and policies'
  },
  {
    value: 'emergency_situations',
    label: 'Emergency Situations',
    description: 'Provide immediate response for urgent matters'
  }
];

/**
 * Escalation condition options for UI
 */
export const ESCALATION_CONDITION_OPTIONS: Array<{
  value: EscalationCondition;
  label: string;
  description: string;
}> = [
  {
    value: 'no_response_after_time',
    label: 'No Response After Time',
    description: 'Escalate if tenant doesn\'t respond within specified time'
  },
  {
    value: 'negative_sentiment',
    label: 'Negative Sentiment',
    description: 'Escalate when negative sentiment is detected'
  },
  {
    value: 'complex_request',
    label: 'Complex Request',
    description: 'Escalate requests that require human judgment'
  },
  {
    value: 'specific_keywords',
    label: 'Specific Keywords',
    description: 'Escalate when certain keywords are mentioned'
  },
  {
    value: 'multiple_attempts',
    label: 'Multiple Attempts',
    description: 'Escalate after multiple failed resolution attempts'
  }
];

/**
 * Tone options with examples
 */
export const TONE_OPTIONS: Array<{
  value: CommunicationTone;
  label: string;
  description: string;
  example: string;
}> = [
  {
    value: 'formal',
    label: 'Formal',
    description: 'Professional and business-like communication',
    example: 'Thank you for contacting us. We have received your maintenance request and will address it promptly.'
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm and approachable communication',
    example: 'Hi there! Thanks for reaching out. We\'ve got your maintenance request and we\'ll take care of it soon.'
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed and conversational communication',
    example: 'Hey! Got your maintenance request - we\'ll get someone over to fix that for you.'
  }
];

/**
 * Style options with examples
 */
export const STYLE_OPTIONS: Array<{
  value: CommunicationStyle;
  label: string;
  description: string;
  example: string;
}> = [
  {
    value: 'concise',
    label: 'Concise',
    description: 'Brief and to-the-point responses',
    example: 'Request received. Maintenance scheduled for tomorrow 2-4 PM.'
  },
  {
    value: 'detailed',
    label: 'Detailed',
    description: 'Comprehensive and thorough responses',
    example: 'We have received your maintenance request for the leaky faucet in your kitchen. Our maintenance team will contact you within 24 hours to schedule a convenient time for repair. The typical repair time is 1-2 hours.'
  },
  {
    value: 'empathetic',
    label: 'Empathetic',
    description: 'Understanding and supportive responses',
    example: 'I understand how frustrating a leaky faucet can be. We\'ll make sure to get this fixed for you as quickly as possible.'
  }
];