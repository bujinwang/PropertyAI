/**
 * Feedback Widget for Epic 21 User Feedback Collection
 * Advanced Analytics and AI Insights Features
 */

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, X, CheckCircle, AlertCircle } from 'lucide-react';
import { feedbackService } from '../services/feedbackService';

interface FeedbackWidgetProps {
  feature: 'predictive_maintenance' | 'tenant_churn_prediction' | 'market_trend_integration' | 'ai_powered_reporting' | 'risk_assessment_dashboard' | 'overall_experience';
  userType: 'property_manager' | 'maintenance_staff' | 'leasing_agent' | 'investor' | 'executive' | 'other';
  className?: string;
}

interface FeedbackForm {
  rating: number;
  title: string;
  description: string;
  category: 'accuracy' | 'usability' | 'performance' | 'functionality' | 'design' | 'integration' | 'data_quality' | 'other';
  feedbackType: 'bug_report' | 'feature_request' | 'usability_feedback' | 'performance_feedback' | 'general_feedback';
}

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  feature,
  userType,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FeedbackForm>({
    rating: 0,
    title: '',
    description: '',
    category: 'usability',
    feedbackType: 'general_feedback'
  });

  // Reset form when widget closes
  useEffect(() => {
    if (!isOpen) {
      setForm({
        rating: 0,
        title: '',
        description: '',
        category: 'usability',
        feedbackType: 'general_feedback'
      });
      setIsSubmitted(false);
      setError(null);
    }
  }, [isOpen]);

  const handleRatingClick = (rating: number) => {
    setForm(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.rating === 0) {
      setError('Please provide a rating');
      return;
    }

    if (!form.title.trim()) {
      setError('Please provide a title');
      return;
    }

    if (!form.description.trim()) {
      setError('Please provide feedback details');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await feedbackService.submitFeedback({
        ...form,
        feature,
        userType,
        url: window.location.href
      });

      setIsSubmitted(true);

      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);

    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeatureDisplayName = (feature: string) => {
    const names = {
      predictive_maintenance: 'Predictive Maintenance',
      tenant_churn_prediction: 'Tenant Churn Prediction',
      market_trend_integration: 'Market Trend Integration',
      ai_powered_reporting: 'AI-Powered Reporting',
      risk_assessment_dashboard: 'Risk Assessment Dashboard',
      overall_experience: 'Overall Experience'
    };
    return names[feature as keyof typeof names] || feature;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-50 ${className}`}
        aria-label="Provide feedback"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Feedback: {getFeatureDisplayName(feature)}
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close feedback widget"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {isSubmitted ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Thank you for your feedback!
            </h4>
            <p className="text-gray-600">
              Your input helps us improve the {getFeatureDisplayName(feature)} feature.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How would you rate this feature?
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      size={24}
                      className={`${
                        star <= form.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of feedback
              </label>
              <select
                value={form.feedbackType}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  feedbackType: e.target.value as FeedbackForm['feedbackType']
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general_feedback">General Feedback</option>
                <option value="usability_feedback">Usability Feedback</option>
                <option value="performance_feedback">Performance Feedback</option>
                <option value="feature_request">Feature Request</option>
                <option value="bug_report">Bug Report</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  category: e.target.value as FeedbackForm['category']
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="usability">Usability</option>
                <option value="performance">Performance</option>
                <option value="functionality">Functionality</option>
                <option value="design">Design</option>
                <option value="accuracy">Accuracy</option>
                <option value="integration">Integration</option>
                <option value="data_quality">Data Quality</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief summary of your feedback"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={200}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide detailed feedback..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                maxLength={2000}
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackWidget;