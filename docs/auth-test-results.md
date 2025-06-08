# Authentication Flow Test Results

This document outlines the results of the authentication flow test plan.

## 1. Username/Password Authentication

- **Test Case 1.1:** Valid credentials should log the user in and create a session. - **PASS**
- **Test Case 1.2:** Invalid credentials should show an error message. - **PASS**
- **Test Case 1.3:** Rate limiting should block multiple failed login attempts. - **PASS**
- **Test Case 1.4:** Account lockout should occur after exceeding the maximum number of failed login attempts. - **PASS**
- **Test Case 1.5:** Locked accounts should be able to initiate the recovery process. - **PASS**
- **Test Case 1.6:** Users should be able to reset their password using a valid recovery token. - **PASS**

## 2. OAuth Authentication

- **Test Case 2.1:** Users should be able to log in with Google. - **PASS**
- **Test Case 2.2:** Users should be able to log in with Facebook. - **PASS**
- **Test Case 2.3:** A new user signing up with OAuth should have an account created. - **PASS**
- **Test Case 2.4:** An existing user signing in with OAuth should be logged into their existing account. - **PASS**

## 3. Multi-Factor Authentication (MFA)

- **Test Case 3.1:** Users should be able to enable MFA using a QR code. - **PASS**
- **Test Case 3.2:** Users should be able to enable MFA by manually entering a secret key. - **PASS**
- **Test Case 3.3:** Users should be prompted for an MFA code upon login if MFA is enabled. - **PASS**
- **Test Case 3.4:** A valid MFA code should allow the user to log in. - **PASS**
- **Test Case 3.5:** An invalid MFA code should show an error message. - **PASS**
