# Authentication Flow Test Plan

This document outlines the test plan for the full authentication flow, including username/password, OAuth, and MFA.

## 1. Username/Password Authentication

- **Test Case 1.1:** Valid credentials should log the user in and create a session.
- **Test Case 1.2:** Invalid credentials should show an error message.
- **Test Case 1.3:** Rate limiting should block multiple failed login attempts.
- **Test Case 1.4:** Account lockout should occur after exceeding the maximum number of failed login attempts.
- **Test Case 1.5:** Locked accounts should be able to initiate the recovery process.
- **Test Case 1.6:** Users should be able to reset their password using a valid recovery token.

## 2. OAuth Authentication

- **Test Case 2.1:** Users should be able to log in with Google.
- **Test Case 2.2:** Users should be able to log in with Facebook.
- **Test Case 2.3:** A new user signing up with OAuth should have an account created.
- **Test Case 2.4:** An existing user signing in with OAuth should be logged into their existing account.

## 3. Multi-Factor Authentication (MFA)

- **Test Case 3.1:** Users should be able to enable MFA using a QR code.
- **Test Case 3.2:** Users should be able to enable MFA by manually entering a secret key.
- **Test Case 3.3:** Users should be prompted for an MFA code upon login if MFA is enabled.
- **Test Case 3.4:** A valid MFA code should allow the user to log in.
- **Test Case 3.5:** An invalid MFA code should show an error message.
