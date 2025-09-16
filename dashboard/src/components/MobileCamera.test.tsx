/**
 * Mobile Camera Component Tests with AI Integration
 * Epic 21.5.3 - Advanced Features Integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileCamera from './MobileCamera';

// Mock the services
jest.mock('../services/aiPhotoAnalysisService', () => ({
  aiPhotoAnalysisService: {
    analyzePhoto: jest.fn().mockResolvedValue({
      id: 'test-analysis-1',
      timestamp: Date.now(),
      confidence: 0.85,
      analysis: {
        propertyType: 'residential',
        condition: 'good',
        features: [
          { type: 'roof', condition: 'good', confidence: 0.9, description: 'Roof in good condition' }
        ],
        issues: [],
        recommendations: [
          { title: 'Regular maintenance', priority: 'low', estimatedCost: 500, timeframe: '6_months' }
        ]
      },
      metadata: {
        processingTime: 1500,
        modelVersion: 'v2.1.0',
        imageQuality: 'high'
      }
    })
  }
}));

jest.mock('../services/propertyTaggingService', () => ({
  propertyTaggingService: {
    generateTags: jest.fn().mockResolvedValue({
      propertyId: 'test-property-1',
      tags: [
        {
          id: 'tag-1',
          category: { id: 'condition', name: 'Property Condition', color: '#2196f3', icon: '🏠', priority: 'high' },
          value: 'Condition: good',
          confidence: 0.85,
          source: 'ai_analysis',
          timestamp: Date.now()
        }
      ],
      summary: {
        totalTags: 1,
        categories: { condition: 1 },
        lastUpdated: Date.now(),
        confidence: 0.85
      }
    })
  }
}));

jest.mock('../services/predictiveMaintenanceService', () => ({
  predictiveMaintenanceService: {
    generatePredictions: jest.fn().mockResolvedValue([]),
    generateAlerts: jest.fn().mockResolvedValue([])
  }
}));

// Mock camera service
jest.mock('../utils/cameraService', () => ({
  default: {
    getCapabilities: jest.fn().mockReturnValue({
      hasCamera: true,
      hasFrontCamera: true,
      hasBackCamera: true,
      supportsFlash: true
    }),
    requestPermission: jest.fn().mockResolvedValue(true),
    startCamera: jest.fn().mockResolvedValue(true),
    capturePhoto: jest.fn().mockResolvedValue({
      blob: new Blob(['test'], { type: 'image/jpeg' }),
      dataUrl: 'data:image/jpeg;base64,test',
      timestamp: Date.now(),
      metadata: { width: 1920, height: 1080 }
    }),
    stopCamera: jest.fn()
  }
}));

// Mock location service
jest.mock('../utils/locationService', () => ({
  default: {
    getCurrentPosition: jest.fn().mockResolvedValue({
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10
    })
  }
}));

// Mock performance optimizer
jest.mock('../utils/cameraPerformance', () => ({
  cameraPerformanceOptimizer: {
    lazyLoadCameraResources: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock accessibility utils
jest.mock('../utils/accessibilityUtils', () => ({
  a11y: {
    announce: jest.fn()
  }
}));

describe('MobileCamera with AI Integration', () => {
  const defaultProps = {
    enableAIAnalysis: true,
    propertyId: 'test-property-1',
    onPhotoCapture: jest.fn(),
    onAIAnalysisComplete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders camera interface with AI features enabled', () => {
    render(<MobileCamera {...defaultProps} />);

    expect(screen.getByRole('application', { name: /Mobile Camera/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Camera preview/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Take photo/i)).toBeInTheDocument();
  });

  it('shows AI analysis progress during photo capture', async () => {
    render(<MobileCamera {...defaultProps} />);

    const captureButton = screen.getByLabelText(/Take photo/i);
    fireEvent.click(captureButton);

    // Should show AI analysis messages
    await waitFor(() => {
      expect(screen.getByText(/🤖 Analyzing photo with AI/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/🏷️ Generating property tags/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/🔧 Checking maintenance needs/i)).toBeInTheDocument();
    });
  });

  it('displays AI analysis results overlay after analysis', async () => {
    render(<MobileCamera {...defaultProps} />);

    const captureButton = screen.getByLabelText(/Take photo/i);
    fireEvent.click(captureButton);

    // Wait for AI analysis to complete
    await waitFor(() => {
      expect(screen.getByText(/✅ AI Analysis Complete/i)).toBeInTheDocument();
    });

    // Should show AI analysis overlay
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/🤖 AI Analysis Results/i)).toBeInTheDocument();
    });

    // Check analysis results are displayed
    expect(screen.getByText('Property Type:')).toBeInTheDocument();
    expect(screen.getByText('residential')).toBeInTheDocument();
    expect(screen.getByText('Condition:')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
  });

  it('calls onAIAnalysisComplete callback with analysis results', async () => {
    const mockOnAIAnalysisComplete = jest.fn();
    render(<MobileCamera {...defaultProps} onAIAnalysisComplete={mockOnAIAnalysisComplete} />);

    const captureButton = screen.getByLabelText(/Take photo/i);
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(mockOnAIAnalysisComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-analysis-1',
          confidence: 0.85,
          analysis: expect.objectContaining({
            propertyType: 'residential',
            condition: 'good'
          })
        }),
        expect.objectContaining({
          propertyId: 'test-property-1',
          tags: expect.any(Array),
          summary: expect.any(Object)
        })
      );
    });
  });

  it('handles AI analysis errors gracefully', async () => {
    // Mock AI service to throw error
    const { aiPhotoAnalysisService } = require('../services/aiPhotoAnalysisService');
    aiPhotoAnalysisService.analyzePhoto.mockRejectedValue(new Error('AI analysis failed'));

    render(<MobileCamera {...defaultProps} />);

    const captureButton = screen.getByLabelText(/Take photo/i);
    fireEvent.click(captureButton);

    // Should show error message but still capture photo
    await waitFor(() => {
      expect(screen.getByText(/⚠️ AI Analysis failed/i)).toBeInTheDocument();
    });
  });

  it('disables AI analysis when enableAIAnalysis is false', async () => {
    render(<MobileCamera {...defaultProps} enableAIAnalysis={false} />);

    const captureButton = screen.getByLabelText(/Take photo/i);
    fireEvent.click(captureButton);

    // Should not show AI analysis messages
    await waitFor(() => {
      expect(screen.queryByText(/🤖 Analyzing photo with AI/i)).not.toBeInTheDocument();
    });
  });

  it('closes AI analysis overlay when close button is clicked', async () => {
    render(<MobileCamera {...defaultProps} />);

    const captureButton = screen.getByLabelText(/Take photo/i);
    fireEvent.click(captureButton);

    // Wait for overlay to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByLabelText(/Close AI analysis/i);
    fireEvent.click(closeButton);

    // Overlay should be closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows property tags in AI analysis overlay', async () => {
    render(<MobileCamera {...defaultProps} />);

    const captureButton = screen.getByLabelText(/Take photo/i);
    fireEvent.click(captureButton);

    // Wait for overlay to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check tags are displayed
    expect(screen.getByText('🏷️ Property Tags')).toBeInTheDocument();
    expect(screen.getByText('🏠 Condition: good')).toBeInTheDocument();
  });

  it('displays maintenance recommendations in AI analysis overlay', async () => {
    render(<MobileCamera {...defaultProps} />);

    const captureButton = screen.getByLabelText(/Take photo/i);
    fireEvent.click(captureButton);

    // Wait for overlay to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check recommendations are displayed
    expect(screen.getByText('💡 Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Regular maintenance')).toBeInTheDocument();
  });

  it('handles keyboard accessibility for AI analysis overlay', async () => {
    render(<MobileCamera {...defaultProps} />);

    const captureButton = screen.getByLabelText(/Take photo/i);
    fireEvent.click(captureButton);

    // Wait for overlay to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Test escape key closes overlay
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});