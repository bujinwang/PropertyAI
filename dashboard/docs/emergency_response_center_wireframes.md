# Emergency Response Center: Wireframes & User Flow

This document outlines the wireframes and user flow for the Emergency Response Center in the PropertyFlow AI application. The center is designed for high-stress situations, prioritizing clarity, speed, and ease of use.

## 1. Screen Layout

The screen will be a real-time dashboard with a clear visual hierarchy, ensuring that the most critical information is immediately accessible.

- **Component:** `EmergencyResponseCenterScreen.tsx`
- **Navigation:** Accessible via a prominent "Emergency" button in the main navigation or header.

## 2. Critical Alert Dashboard

**Objective:** Provide an at-a-glance view of all active and recent emergencies.

**Wireframe:**
- **Title:** "Critical Alerts"
- **Layout:** A list or card-based view of alerts, sorted by priority.
- **Card Content:**
    - **Alert Type:** (e.g., "Fire," "Flood") with a corresponding icon.
    - **Location:** Property address and unit number.
    - **Status:** (e.g., "New," "In Progress," "Resolved") with color-coding (Red for new/critical, Yellow for in-progress, Green for resolved).
    - **Timestamp:** When the alert was received.
- **Action:** Clicking an alert opens a detailed view with response protocols and status tracking.

## 3. Emergency Contact Management

**Objective:** Provide immediate access to key contacts.

**Wireframe:**
- **Title:** "Emergency Contacts"
- **Layout:** A searchable list of contacts.
- **List Item Content:**
    - Contact name and role (e.g., "John Doe - Lead Maintenance").
    - "Call" and "Message" buttons for one-tap communication.
- **Action:** A button to "Add/Edit Contacts" which opens a separate management modal.

## 4. Response Protocol Display

**Objective:** Guide users through the correct procedures for each type of emergency.

**Wireframe:**
- **Trigger:** Displayed when an alert is selected.
- **Layout:** An interactive checklist.
- **Content:**
    - **Protocol Title:** (e.g., "Fire Response Protocol").
    - **Steps:** A list of actionable steps (e.g., "1. Evacuate the building," "2. Call 911," "3. Notify property manager").
    - **Checkboxes:** To mark steps as completed.

## 5. Emergency Services Integration

**Objective:** Streamline communication with official emergency services.

**Wireframe:**
- **Component:** A dedicated panel within the alert detail view.
- **Content:**
    - **"Report to 911" button:** Pre-fills a report with the property address and incident type.
    - **Status:** Shows the status of the report (e.g., "Sent," "Acknowledged").

## 6. Real-time Status Tracking

**Objective:** Provide a live view of the ongoing emergency response.

**Wireframe:**
- **Component:** An interactive map view.
- **Features:**
    - **Incident Location:** A pin marking the affected property.
    - **Response Team Tracking:** Icons showing the real-time location of dispatched maintenance or security personnel (if available).
    - **Status Log:** A timestamped log of key events (e.g., "10:05 PM: Maintenance team dispatched," "10:15 PM: Fire department on scene").

## 7. Communication Center

**Objective:** Facilitate coordination among the response team.

**Wireframe:**
- **Component:** A chat interface embedded within the alert detail view.
- **Features:**
    - A group chat for all assigned responders.
    - Quick-send buttons for common messages (e.g., "On my way," "Situation contained").
    - Voice note capability for hands-free communication.

## 8. Push Notifications

- **Alerts:** Immediate push notifications for new critical alerts, sent to all relevant personnel.
- **Updates:** Notifications for major status changes in an ongoing emergency.
