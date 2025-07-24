# System Patterns: PropertyAI Application

**Navigation:**
*   The application uses React Navigation for screen transitions.
*   A root navigator (`RootNavigator`) manages the primary navigation flow.
*   Navigation utilities (`navigationUtils`) provide helper functions for navigation actions.

**State Management:**
*   React Context (`AppProviders`) is used for managing global application state.
*   Component-level state is managed using React Hooks (`useState`, `useEffect`).

**Component Structure:**
*   Components are organized by feature and located in the `src/components` directory.
*   Screens are located in `src/screens` and represent full-page views.

**Styling:**
*   Styles are defined using `StyleSheet.create` for performance and maintainability.
*   A consistent theme is applied across the application.

This upgrade should not fundamentally alter these patterns, but I will need to verify that all navigation and state management libraries are compatible with React Native 0.80.2.
