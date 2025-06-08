# Security Testing: Rate Limiting & Account Lockout Test Plan

This document outlines the test plan for security testing of the rate limiting and account lockout features.

## 1. Rate Limiting

- **Test Case 1.1:** Verify that multiple failed login attempts from the same IP address are blocked after exceeding the configured limit.
- **Test Case 1.2:** Verify that the `Retry-After` header is sent in the response when a request is rate-limited.
- **Test Case 1.3:** Verify that other endpoints are not affected by the login rate limiter.
- **Test Case 1.4:** Verify that the rate limit is reset after the configured time window.

## 2. Account Lockout

- **Test Case 2.1:** Verify that an account is locked after exceeding the maximum number of failed login attempts.
- **Test Case 2.2:** Verify that a locked account cannot be logged into, even with the correct credentials.
- **Test Case 2.3:** Verify that the account is automatically unlocked after the configured lockout duration.
- **Test Case 2.4:** Verify that a user can recover a locked account using the account recovery process.
- **Test Case 2.5:** Verify that a successful login resets the failed login attempt counter.
