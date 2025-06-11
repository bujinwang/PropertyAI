# AI-Guided Setup Wizard: Wireframes & User Flow

This document outlines the wireframes and user flow for the AI-Guided Setup Wizard in the PropertyFlow AI mobile application. The wizard is designed to streamline the onboarding process for new users by providing intelligent defaults and personalized recommendations.

## 1. Wizard Structure

The wizard will be a multi-step process, guided by the `ProgressSteps` component to provide clear feedback on the user's location within the flow.

- **Component:** `AIGuidedSetupWizardScreen.tsx` will serve as the main container.
- **Navigation:** A stack navigator will manage the flow between steps.
- **State Management:** A service, potentially `setupWizardService.ts`, will manage the state of the wizard across different steps.

## 2. Step 1: Role Selection

**Objective:** Allow the user to identify as a "Property Manager" or a "Tenant". This choice will tailor the rest of the setup process.

**Wireframe:**
- **Title:** "Welcome to PropertyFlow AI! What's your role?"
- **Components:**
    - Use two `RoleSelectorCard.tsx` components, one for "Property Manager" and one for "Tenant".
    - Each card will have an icon and a brief description of the role.
- **Action:** Tapping a card selects the role and navigates to the next step.

## 3. Step 2: Profile & Portfolio Configuration (Property Manager)

**Objective:** Gather basic profile information and understand the scale of the user's portfolio.

**Wireframe:**
- **Title:** "Tell us about your portfolio."
- **Components:**
    - `PortfolioSizeForm.tsx`: A form to input the number of properties and units managed.
    - Input fields for company name (optional) and contact information.
- **AI Feature:** Based on the portfolio size, the AI can suggest a default subscription tier or feature set. This suggestion will be displayed on the recommendations screen.

## 4. Step 3: Communication Preferences

**Objective:** Allow the user to configure how they receive notifications from the app.

**Wireframe:**
- **Title:** "How should we keep you updated?"
- **Components:**
    - `CommunicationPreferences.tsx`: A component that allows toggling notifications for different categories (e.g., new messages, maintenance updates, financial reports).
    - Options for push notifications, email, and in-app alerts.
- **AI Feature:** The AI can suggest a default notification scheme based on the user's role. For example, a property manager might have more financial alerts enabled by default.

## 5. Step 4: AI Personalization & Recommendations

**Objective:** Showcase the power of the AI by providing personalized setup recommendations.

**Wireframe:**
- **Title:** "Here are some AI-powered recommendations to get you started."
- **Components:**
    - `RecommendationsScreen.tsx`: A screen that displays a list of `RecommendationCard.tsx` components.
    - Each card will represent a suggested setting or feature to enable, such as:
        - "Enable Smart Maintenance Routing"
        - "Automate Tenant Screening"
        - "Activate Predictive Cost Analysis"
- **Action:** Users can accept or dismiss each recommendation.

## 6. Step 5: Summary & Completion

**Objective:** Provide a summary of the selected settings and confirm the completion of the setup process.

**Wireframe:**
- **Title:** "Setup Complete!"
- **Content:**
    - A summary of the key settings configured during the wizard.
    - A confirmation message.
- **Action:** A "Go to Dashboard" button that navigates the user to their main dashboard screen.

## 7. API and Service Integration

- **`setupWizardService.ts`**: This service will be responsible for:
    - Storing the state of the wizard.
    - Saving the final configuration to the backend.
    - Fetching AI-powered recommendations.
- **Backend API:** Endpoints will be needed to:
    - Save user roles, profile information, and preferences.
    - Provide AI recommendations based on initial user input.
