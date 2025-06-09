"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
// Redirect to provider for authentication
router.get('/:provider', (req, res, next) => {
    const provider = req.params.provider;
    passport_1.default.authenticate(provider, { scope: ['email', 'profile'] })(req, res, next);
});
// Callback URL for provider
router.get('/:provider/callback', (req, res, next) => {
    const provider = req.params.provider;
    passport_1.default.authenticate(provider, {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
    })(req, res, next);
});
exports.default = router;
//# sourceMappingURL=oauthRoutes.js.map