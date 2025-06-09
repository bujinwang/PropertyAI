"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimit = exports.passwordResetRateLimit = exports.loginRateLimit = exports.rateLimit = void 0;
const redis_1 = __importDefault(require("redis"));
const util_1 = require("util");
const config_1 = require("../config/config");
// Create Redis client for storing rate limit data
const redisClient = redis_1.default.createClient({
    url: config_1.config.redis.url,
    password: config_1.config.redis.password,
});
// Promisify Redis methods for async/await usage
const getAsync = (0, util_1.promisify)(redisClient.get).bind(redisClient);
const setAsync = (0, util_1.promisify)(redisClient.set).bind(redisClient);
const incrAsync = (0, util_1.promisify)(redisClient.incr).bind(redisClient);
const expireAsync = (0, util_1.promisify)(redisClient.expire).bind(redisClient);
redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});
/**
 * Creates a rate limiting middleware with the specified options
 */
const rateLimit = (options) => {
    const { max = 5, windowMs = 60 * 1000, // 1 minute default
    message = 'Too many requests, please try again later.', keyGenerator = (req) => {
        // Default key is IP address and route
        return `ratelimit:${req.ip}:${req.path}`;
    }, skip = () => false, headers = true, } = options;
    // Convert windowMs to seconds for Redis expiry
    const windowSeconds = Math.ceil(windowMs / 1000);
    return async (req, res, next) => {
        // Skip rate limiting if specified
        if (skip(req)) {
            return next();
        }
        const key = keyGenerator(req);
        try {
            // Get current count
            let current = await getAsync(key);
            // Initialize if not exists
            if (!current) {
                await setAsync(key, '0');
                await expireAsync(key, windowSeconds);
                current = '0';
            }
            // Increment count
            const count = await incrAsync(key);
            // Set Redis expiry if it's the first request
            if (count === 1) {
                await expireAsync(key, windowSeconds);
            }
            // Add headers if enabled
            if (headers) {
                res.setHeader('X-RateLimit-Limit', max.toString());
                res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count).toString());
                // Get TTL for reset header
                const ttl = await (0, util_1.promisify)(redisClient.ttl).bind(redisClient)(key);
                res.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());
            }
            // Allow the request if under the limit
            if (count <= max) {
                return next();
            }
            // Rate limit exceeded
            res.status(429).json({
                message,
                retryAfter: windowSeconds,
            });
        }
        catch (err) {
            console.error('Rate limit error:', err);
            // Don't block the request if Redis fails
            return next();
        }
    };
};
exports.rateLimit = rateLimit;
/**
 * Specialized rate limiter for login attempts
 * More strict limits for login attempts to prevent brute force attacks
 */
exports.loginRateLimit = (0, exports.rateLimit)({
    max: 5, // 5 login attempts
    windowMs: 15 * 60 * 1000, // per 15 minutes
    message: 'Too many login attempts. Please try again later.',
    keyGenerator: (req) => {
        // Use email or IP if email not available
        const email = req.body.email || '';
        return `login:${email || req.ip}`;
    },
});
/**
 * Specialized rate limiter for password reset requests
 */
exports.passwordResetRateLimit = (0, exports.rateLimit)({
    max: 3, // 3 reset requests
    windowMs: 60 * 60 * 1000, // per hour
    message: 'Too many password reset requests. Please try again later.',
    keyGenerator: (req) => {
        // Use email or IP if email not available
        const email = req.body.email || '';
        return `pwreset:${email || req.ip}`;
    },
});
/**
 * General API rate limiter for all routes
 * Less strict than login/password reset limiters
 */
exports.apiRateLimit = (0, exports.rateLimit)({
    max: 100, // 100 requests
    windowMs: 60 * 1000, // per minute
    message: 'Too many requests. Please try again later.',
});
exports.default = {
    rateLimit: exports.rateLimit,
    loginRateLimit: exports.loginRateLimit,
    passwordResetRateLimit: exports.passwordResetRateLimit,
    apiRateLimit: exports.apiRateLimit,
};
//# sourceMappingURL=rateLimit.js.map