# AI Suggestion Presentation Patterns

This document outlines the design patterns for presenting AI-generated suggestions to users in a clear and consistent manner.

## Rationale

It is crucial to distinguish AI-generated content from user-generated content to maintain transparency and user trust. These patterns are designed to be intuitive and non-intrusive, providing users with the necessary context to understand and act on AI suggestions.

## Core Components

- **`SuggestionChip`**: A chip component with a "Sparkle" icon to label AI suggestions.
- **`AIGeneratedContent`**: A container component with a distinct border to wrap larger blocks of AI-generated content.
- **`ConfidenceIndicator`**: A component to display the confidence level of an AI suggestion.

## Patterns by Context

### 1. In-line Text Suggestions

- **Use Case:** Suggesting a word or phrase in a text input or form field.
- **Pattern:**
    - Display the suggestion in a `SuggestionChip` next to the input field.
    - Clicking the chip inserts the suggestion into the field.

### 2. Form Field Suggestions

- **Use Case:** Suggesting a value for an entire form field (e.g., a suggested rent price).
- **Pattern:**
    - Display the suggestion below the form field, wrapped in an `AIGeneratedContent` container.
    - Include a `ConfidenceIndicator` to show the confidence level of the suggestion.
    - Provide "Accept" and "Dismiss" buttons for the user to act on the suggestion.

### 3. Chat Message Suggestions

- **Use Case:** Suggesting a response in a chat interface.
- **Pattern:**
    - Display the suggested response as a `SuggestionChip` above the chat input field.
    - Clicking the chip populates the input field with the suggested text.

### 4. List or Table Suggestions

- **Use Case:** Suggesting an action for an item in a list or table (e.g., a recommended vendor).
- **Pattern:**
    - Add a "Sparkle" icon next to the suggested item.
    - Include a `ConfidenceIndicator` in a relevant column.
    - A tooltip on the icon can provide a brief explanation of why the suggestion was made.

## Accessibility Considerations

- **Color Contrast:** Ensure that the colors used for AI-specific components have sufficient contrast to be accessible to users with visual impairments.
- **Screen Readers:** Use ARIA attributes to ensure that screen readers can identify and announce AI-generated content and suggestions.
