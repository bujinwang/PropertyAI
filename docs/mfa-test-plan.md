# MFA Setup & Verification Test Plan

This document outlines the test plan for MFA setup and verification.

## 1. MFA Setup

- **Test Case 1.1:** Users should be able to enable MFA using a QR code with Google Authenticator.
- **Test Case 1.2:** Users should be able to enable MFA using a QR code with Authy.
- **Test Case 1.3:** Users should be able to enable MFA by manually entering a secret key with Google Authenticator.
- **Test Case 1.4:** Users should be able to enable MFA by manually entering a secret key with Authy.
- **Test Case 1.5:** Backup codes should be generated and displayed to the user upon successful MFA setup.

## 2. MFA Verification

- **Test Case 2.1:** Users should be prompted for an MFA code upon login if MFA is enabled.
- **Test Case 2.2:** A valid MFA code from Google Authenticator should allow the user to log in.
- **Test Case 2.3:** A valid MFA code from Authy should allow the user to log in.
- **Test Case 2.4:** An invalid MFA code should show an error message.
- **Test Case 2.5:** A used backup code should not be valid for a subsequent login.
- **Test Case 2.6:** Users should be able to log in using a valid backup code.
