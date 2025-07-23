/**
 * RecommendationCard Component Tests
 * Tests for the recommendation card functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationItem } from '../../types/personalization';

const theme = createTheme();

const mockItem: RecommendationItem = {
  id: 'test-item-1',
  title: 'Test Service',
  description: 'This is a test service description',
  content: 'Test content',
  imageUrl: 'https://example.com/image.jpg',
  ctaText: 'Book Now',
  ctaUrl: 'https://example.com/book',
  category: 'local-services',
  tags: ['test', 'service'],
  reasoning: 'Test reasoning',
  personalizedFor: 'user-123',
  priority: 1,
  confidence: 85,
  timestamp: new Date(),
  explanation: 'Test explanation',
};

const defaultProps = {
  item: mockItem,
  onExplanationRequest: jest.fn(),
  onFeedback: jest.fn(),
  onCtaClick: jest.fn(),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('RecommendationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders recommendation card with all required elements', () => {
    renderWithTheme(<RecommendationCard {...defaultProps} />);
    
    // Check if main elements are present
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('This is a test service description')).toBeInTheDocument();
    expect(screen.getByText('Book Now')).toBeInTheDocument();
    expect(screen.getByText('For You')).toBeInTheDocument();
  });

  it('displays personalization label when showPersonalizationLabel is true', () => {
    renderWithTheme(
      <RecommendationCard {...defaultProps} showPersonalizationLabel={true} />
    );
    
    expect(screen.getByText('For You')).toBeInTheDocument();
  });

  it('hides personalization label when showPersonalizationLabel is false', () => {
    renderWithTheme(
      <RecommendationCard {...defaultProps} showPersonalizationLabel={false} />
    );
    
    expect(screen.queryByText('For You')).not.toBeInTheDocument();
  });

  it('calls onCtaClick when CTA button is clicked', () => {
    renderWithTheme(<RecommendationCard {...defaultProps} />);
    
    const ctaButton = screen.getByText('Book Now');
    fireEvent.click(ctaButton);
    
    expect(defaultProps.onCtaClick).toHaveBeenCalledWith('test-item-1', 'https://example.com/book');
  });

  it('calls onExplanationRequest when explanation button is clicked', () => {
    renderWithTheme(<RecommendationCard {...defaultProps} />);
    
    const explanationButton = screen.getByLabelText('Why am I seeing this?');
    fireEvent.click(explanationButton);
    
    expect(defaultProps.onExplanationRequest).toHaveBeenCalledWith('test-item-1');
  });

  it('opens feedback dialog when thumbs up is clicked', async () => {
    renderWithTheme(<RecommendationCard {...defaultProps} />);
    
    const thumbsUpButton = screen.getByLabelText('This is helpful');
    fireEvent.click(thumbsUpButton);
    
    await waitFor(() => {
      expect(screen.getByText('Great! Tell us more')).toBeInTheDocument();
    });
  });

  it('opens feedback dialog when thumbs down is clicked', async () => {
    renderWithTheme(<RecommendationCard {...defaultProps} />);
    
    const thumbsDownButton = screen.getByLabelText('This is not helpful');
    fireEvent.click(thumbsDownButton);
    
    await waitFor(() => {
      expect(screen.getByText('Help us improve')).toBeInTheDocument();
    });
  });

  it('submits feedback when feedback form is completed', async () => {
    renderWithTheme(<RecommendationCard {...defaultProps} />);
    
    // Click thumbs up
    const thumbsUpButton = screen.getByLabelText('This is helpful');
    fireEvent.click(thumbsUpButton);
    
    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Great! Tell us more')).toBeInTheDocument();
    });
    
    // Add comment
    const commentField = screen.getByLabelText('Additional comments (optional)');
    fireEvent.change(commentField, { target: { value: 'Great service!' } });
    
    // Submit feedback
    const submitButton = screen.getByText('Submit Feedback');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(defaultProps.onFeedback).toHaveBeenCalledWith('test-item-1', 'positive', 'Great service!');
    });
  });

  it('displays tags correctly', () => {
    renderWithTheme(<RecommendationCard {...defaultProps} />);
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('service')).toBeInTheDocument();
  });

  it('displays confidence indicator', () => {
    renderWithTheme(<RecommendationCard {...defaultProps} />);
    
    // The confidence indicator should be present (checking for the confidence score)
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders image when imageUrl is provided', () => {
    renderWithTheme(<RecommendationCard {...defaultProps} />);
    
    const image = screen.getByAltText('Test Service');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('shows feedback sent status after feedback is submitted', async () => {
    renderWithTheme(<RecommendationCard {...defaultProps} />);
    
    // Click thumbs up
    const thumbsUpButton = screen.getByLabelText('This is helpful');
    fireEvent.click(thumbsUpButton);
    
    // Wait for dialog and submit
    await waitFor(() => {
      expect(screen.getByText('Great! Tell us more')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('Submit Feedback');
    fireEvent.click(submitButton);
    
    // Check feedback sent status
    await waitFor(() => {
      expect(screen.getByText('Feedback sent')).toBeInTheDocument();
    });
    
    // Feedback buttons should be hidden
    expect(screen.queryByLabelText('This is helpful')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('This is not helpful')).not.toBeInTheDocument();
  });
});