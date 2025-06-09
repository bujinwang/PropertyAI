"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.requireAdmin = void 0;
/**
 * Middleware to check if user has admin privileges
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
const requireAdmin = (req, res, next) => {
    try {
        // Check if user exists in request (should be set by authentication middleware)
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        // Check if user has admin role
        if (req.user.role !== 'ADMIN') {
            res.status(403).json({ message: 'Admin privileges required' });
            return;
        }
        // User is authenticated and has admin role
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', (error === null || error === void 0 ? void 0 : error.message) || error);
        res.status(500).json({ message: 'Internal server error in auth middleware' });
    }
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware to check if user is authenticated
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
const requireAuth = (req, res, next) => {
    try {
        // Check if user exists in request (should be set by authentication middleware)
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        // User is authenticated
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', (error === null || error === void 0 ? void 0 : error.message) || error);
        res.status(500).json({ message: 'Internal server error in auth middleware' });
    }
};
exports.requireAuth = requireAuth;
// Export middleware functions
exports.default = {
    requireAdmin: exports.requireAdmin,
    requireAuth: exports.requireAuth
};
//# sourceMappingURL=auth.middleware.js.map