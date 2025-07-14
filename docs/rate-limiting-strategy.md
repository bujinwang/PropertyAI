# Rate Limiting Strategy

This document outlines the strategy and library chosen for implementing rate limiting in the backend.

## Strategy

A fixed window strategy will be used. This strategy is simple to implement and effective for preventing brute-force attacks.

## Library

The `express-rate-limit` library will be used. It is a popular and well-maintained library for implementing rate limiting in Express.js applications. It is easy to configure and supports various storage options.
