/**
 * Mobile Workflow Component
 * Optimized mobile data entry workflows with touch-friendly interactions
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './MobileWorkflow.css';

export interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  fields: WorkflowField[];
  validation?: (data: any) => string | null;
}

export interface WorkflowField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'time' | 'photo' | 'location';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
  autoFocus?: boolean;
}

interface MobileWorkflowProps {
  steps: WorkflowStep[];
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  className?: string;
  title?: string;
  initialData?: any;
  autoProgress?: boolean;
}

const MobileWorkflow: React.FC<MobileWorkflowProps> = ({
  steps,
  onComplete,
  onCancel,
  className = '',
  title = 'Mobile Workflow',
  initialData = {},
  autoProgress = true
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workflowData, setWorkflowData] = useState<any>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentStep = steps[currentStepIndex];
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-focus first field
  useEffect(() => {
    if (currentStep && formRef.current) {
      const firstField = currentStep.fields.find(field => field.autoFocus);
      if (firstField) {
        const input = formRef.current.querySelector(`[name="${firstField.id}"]`) as HTMLInputElement;
        if (input) {
          setTimeout(() => input.focus(), 100);
        }
      }
    }
  }, [currentStepIndex, currentStep]);

  // Handle field value changes
  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setWorkflowData((prev: any) => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate current step
  const validateStep = useCallback((): boolean => {
    const stepErrors: Record<string, string> = {};

    currentStep.fields.forEach(field => {
      const value = workflowData[field.id];

      // Required field validation
      if (field.required && (!value || value.toString().trim() === '')) {
        stepErrors[field.id] = `${field.label} is required`;
        return;
      }

      // Field-specific validation
      if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          stepErrors[field.id] = error;
        }
      }

      // Type-specific validation
      if (value) {
        switch (field.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              stepErrors[field.id] = 'Please enter a valid email address';
            }
            break;
          case 'tel':
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
              stepErrors[field.id] = 'Please enter a valid phone number';
            }
            break;
          case 'number':
            if (isNaN(Number(value))) {
              stepErrors[field.id] = 'Please enter a valid number';
            }
            break;
        }
      }
    });

    // Step-level validation
    if (currentStep.validation) {
      const stepError = currentStep.validation(workflowData);
      if (stepError) {
        stepErrors.step = stepError;
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, [currentStep, workflowData]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (!validateStep()) {
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStepIndex, steps.length, validateStep]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  // Handle completion
  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);

    try {
      if (onComplete) {
        await onComplete(workflowData);
      }
    } catch (error) {
      console.error('Workflow completion error:', error);
      setErrors({ submit: 'Failed to complete workflow. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [workflowData, onComplete]);

  // Handle keyboard navigation
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (autoProgress) {
        handleNext();
      }
    }
  }, [autoProgress, handleNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Render field component
  const renderField = (field: WorkflowField) => {
    const value = workflowData[field.id] || '';
    const error = errors[field.id];
    const fieldClass = `workflow-field ${error ? 'error' : ''}`;

    const commonProps = {
      name: field.id,
      value,
      placeholder: field.placeholder,
      required: field.required,
      className: fieldClass,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        handleFieldChange(field.id, e.target.value);
      }
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <div key={field.id} className="field-container">
            <label className="field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              {...commonProps}
              type={field.type}
              inputMode={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
            />
            {error && <span className="field-error">{error}</span>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="field-container">
            <label className="field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <textarea
              {...commonProps}
              rows={3}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
            {error && <span className="field-error">{error}</span>}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="field-container">
            <label className="field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <select
              {...commonProps}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <span className="field-error">{error}</span>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="field-container checkbox-container">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name={field.id}
                checked={!!value}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-mark"></span>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {error && <span className="field-error">{error}</span>}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="field-container">
            <label className="field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="radio-group">
              {field.options?.map(option => (
                <label key={option.value} className="radio-label">
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="radio-input"
                  />
                  <span className="radio-mark"></span>
                  {option.label}
                </label>
              ))}
            </div>
            {error && <span className="field-error">{error}</span>}
          </div>
        );

      case 'date':
      case 'time':
        return (
          <div key={field.id} className="field-container">
            <label className="field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              {...commonProps}
              type={field.type}
            />
            {error && <span className="field-error">{error}</span>}
          </div>
        );

      default:
        return null;
    }
  };

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className={`mobile-workflow ${className}`}>
      {/* Header */}
      <div className="workflow-header">
        <div className="workflow-title">
          <h2>{title}</h2>
          <span className="step-counter">
            {currentStepIndex + 1} of {steps.length}
          </span>
        </div>

        <button
          className="close-button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          ✕
        </button>
      </div>

      {/* Progress Bar */}
      <div className="workflow-progress">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Content */}
      <div className="workflow-content">
        <div className="step-header">
          <h3>{currentStep.title}</h3>
          {currentStep.description && (
            <p className="step-description">{currentStep.description}</p>
          )}
        </div>

        <form ref={formRef} className="workflow-form">
          {currentStep.fields.map(renderField)}

          {errors.step && (
            <div className="step-error">
              {errors.step}
            </div>
          )}

          {errors.submit && (
            <div className="submit-error">
              {errors.submit}
            </div>
          )}
        </form>
      </div>

      {/* Navigation */}
      <div className="workflow-navigation">
        <button
          className="nav-button secondary"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0 || isSubmitting}
        >
          Previous
        </button>

        <button
          className="nav-button primary"
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' :
           currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
        </button>
      </div>

      {/* Keyboard Hint */}
      <div className="keyboard-hint">
        <small>💡 Press Enter to continue</small>
      </div>
    </div>
  );
};

export default MobileWorkflow;