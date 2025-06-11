# Security Settings Dashboard: Wireframes & User Flow

This document outlines the wireframes and user flow for the Security Settings Dashboard in the PropertyFlow AI application. The dashboard is designed to provide users with a clear and comprehensive overview of their account security.

## 1. Dashboard Layout

The screen will be a single, scrollable dashboard with a clean, intuitive layout.

- **Component:** `SecuritySettingsDashboard.tsx`
- **Navigation:** Accessible from the main settings or profile menu.

## 2. Account Security Level

**Objective:** Provide an at-a-glance assessment of the user's account security.

**Wireframe:**
- **Title:** "Account Security Level"
- **Component:** A progress bar or a gauge chart to visually represent the security score.
- **Content:**
    - The current security level (e.g., "High," "Medium," "Low") with a corresponding color (Green, Yellow, Red).
    - A list of actionable recommendations to improve the score (e.g., "Enable Two-Factor Authentication," "Use a stronger password").

## 3. Login Attempt Visualization

**Objective:** Allow users to monitor login activity for their account.

**Wireframe:**
- **Title:** "Recent Login Attempts"
- **Component:** An interactive map displaying the geographic location of recent login attempts.
- **Features:**
    - Pins on the map to indicate login locations.
    - A list or table view of login attempts with details (Date, Time, Location, IP Address, Device).
    - Filtering options to view attempts by date range.

## 4. Device Management

**Objective:** Give users control over which devices can access their account.

**Wireframe:**
- **Title:** "Authorized Devices"
- **Layout:** A list of all devices that have logged into the account.
- **List Item Content:**
    - Device type icon (e.g., desktop, mobile).
    - Device name and location.
    - "Last accessed" timestamp.
    - A "Revoke Access" button for each device.

## 5. Advanced Notification Preferences

**Objective:** Allow users to customize security-related notifications.

**Wireframe:**
- **Title:** "Security Notification Preferences"
- **Layout:** A list of security events.
- **List Item Content:**
    - Event name (e.g., "New Device Login," "Failed Login Attempt").
    - Toggles for different notification channels (Email, SMS, Push).

## 6. Risk Scoring and Anomaly Detection

- **Integration:** The login attempt visualization will incorporate risk scoring.
- **Visual Cues:** Login attempts flagged as high-risk by the AI will be highlighted in red on the map and in the list.
- **Alerts:** A notification will be sent to the user for high-risk login attempts, based on their preferences.

## 7. Security Recommendations

- **Contextual Recommendations:** The "Account Security Level" section will provide dynamic recommendations based on the user's current settings.
- **Actionable Links:** Each recommendation will include a direct link to the relevant settings page to make it easy for the user to take action.
