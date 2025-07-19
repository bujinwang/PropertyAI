# AI Components

This directory contains the core AI component infrastructure for the PropertyFlow AI Dashboard. These components provide consistent patterns for displaying AI-generated content, confidence scores, explanations, and user feedback mechanisms.

## Components Overview

### AIGeneratedContent
A wrapper component that visually distinguishes AI-generated content from regular content.

**Features:**
- Visual distinction with borders and AI labels
- Confidence score display
- Integrated feedback mechanism (thumbs up/down)
- Explanation tooltips
- Two variants: `outlined` and `filled`

**Usage:**
```tsx
import { AIGeneratedContent } from '../design-system/components/ai';

<AIGeneratedContent
  confidence={85}
  explanation="This recommendation is based on market analysis..."
  onFeedback={(feedback) => console.log(feedback)}
  variant="outlined"
>
  <Typography>Your AI-generated content here</Typography>
</AIGeneratedContent>
```

### ConfidenceIndicator
Displays confidence scores with visual indicators and optional explanations.

**Features:**
- Linear and circular progress variants
- Color-coded confidence levels (green/yellow/red)
- Tooltip explanations
- Multiple sizes (small/medium/large)
- Numerical score display

**Usage:**
```tsx
import { ConfidenceIndicator } from '../design-system/components/ai';

<ConfidenceIndicator
  confidence={75}
  variant="linear"
  colorCoded
  showTooltip
  explanation="Confidence based on data quality and model accuracy"
/>
```

### SuggestionChip
Enhanced chip component for displaying AI suggestions with feedback capabilities.

**Features:**
- AI suggestion icon and labeling
- Confidence score in label
- Feedback popover with thumbs up/down
- Optional detailed feedback text field
- Visual feedback state indication

**Usage:**
```tsx
import { SuggestionChip } from '../design-system/components/ai';

<SuggestionChip
  label="Increase rent by 5%"
  confidence={78}
  showFeedback
  onFeedback={(feedback) => handleFeedback(feedback)}
/>
```

### ExplanationTooltip
Provides rich contextual explanations for AI decisions and recommendations.

**Features:**
- Support for simple text or complex explanation objects
- Factor breakdown with impact indicators
- Methodology and limitations display
- Interactive tooltips with proper accessibility
- Customizable placement and styling

**Usage:**
```tsx
import { ExplanationTooltip } from '../design-system/components/ai';

const explanation = {
  title: 'Risk Assessment',
  content: 'This score is calculated based on multiple factors...',
  factors: [
    {
      name: 'Credit Score',
      value: 750,
      weight: 0.4,
      description: 'Excellent credit indicates low risk',
      impact: 'positive'
    }
  ],
  methodology: 'Machine learning model trained on 10,000+ applications',
  limitations: ['Model accuracy decreases for unique circumstances']
};

<ExplanationTooltip
  title="AI Explanation"
  content={explanation}
  placement="top"
>
  <Button>Hover for explanation</Button>
</ExplanationTooltip>
```

### LoadingStateIndicator
Displays AI processing states with estimated completion times.

**Features:**
- Three variants: `spinner`, `progress`, `skeleton`
- Estimated time display with smart formatting
- Progress percentage for determinate operations
- Multiple sizes and accessibility support
- Proper ARIA labels and live regions

**Usage:**
```tsx
import { LoadingStateIndicator } from '../design-system/components/ai';

<LoadingStateIndicator
  message="Processing AI analysis..."
  variant="progress"
  progress={65}
  estimatedTime={30}
  size="medium"
/>
```

## Type Definitions

All components use TypeScript interfaces defined in `../../../types/ai.ts`:

- `AIGeneratedContentProps` - Props for AI content wrapper
- `ConfidenceIndicatorProps` - Props for confidence display
- `SuggestionChipProps` - Props for suggestion chips
- `ExplanationTooltipProps` - Props for explanation tooltips
- `LoadingStateIndicatorProps` - Props for loading indicators
- `AIFeedback` - User feedback structure
- `AIExplanation` - Complex explanation structure
- `AISuggestion` - AI suggestion with metadata

## Accessibility Features

All components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA attributes and labels
- **Color Contrast**: Minimum 4.5:1 contrast ratio for all text
- **Focus Management**: Clear focus indicators and logical tab order
- **Alternative Text**: Descriptive labels for visual elements

## Theming and Customization

Components integrate with the Material-UI theme system:

- Use theme colors for consistent branding
- Respect theme typography settings
- Support dark/light mode switching
- Customizable through theme overrides

## Testing

Components include comprehensive test coverage:

- Unit tests with Jest and React Testing Library
- Accessibility testing with jest-axe
- Visual regression testing
- Integration tests for user interactions

## Demo

Visit `/ai-components-demo` in the application to see all components in action with interactive examples.

## Requirements Compliance

These components fulfill the following requirements:

- **9.1**: Visual distinction for AI-generated content
- **9.2**: AI suggestion labels and icons
- **9.3**: Color-coded confidence indicators with explanations
- **9.4**: Feedback mechanisms for AI suggestions
- **9.5**: Loading states with estimated completion times
- **9.6**: Explanation tooltips and panels
- **10.1**: Keyboard navigation support
- **10.2**: ARIA attributes for screen readers
- **10.3**: High contrast text and visual elements
- **10.4**: Descriptive alt text for images
- **10.5**: Proper form labels and associations