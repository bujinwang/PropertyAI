"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const mfaService_1 = require("../services/mfaService");
const dbManager_1 = require("../utils/dbManager");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
/**
 * @route   GET /api/mfa/status
 * @desc    Get the MFA status for the authenticated user
 * @access  Private
 */
router.get('/status', authMiddleware_1.authMiddleware.protect, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const isEnabled = await (0, mfaService_1.isMFAEnabled)(userId);
        return res.json({ mfaEnabled: isEnabled });
    }
    catch (error) {
        console.error('Error getting MFA status:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
/**
 * @route   POST /api/mfa/setup
 * @desc    Generate and save a new MFA secret for the user
 * @access  Private
 */
router.post('/setup', authMiddleware_1.authMiddleware.protect, async (req, res) => {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Generate a new secret
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const secret = await (0, mfaService_1.generateMFASecret)(req.user.email);
        // Store the secret for the user (but don't enable MFA yet)
        await dbManager_1.prisma.user.update({
            where: { id: userId },
            data: { mfaSecret: secret.secret }
        });
        // Return the secret to be displayed to the user
        return res.json({
            secret,
            // Include the user's email for QR code generation on the client side
            email: (_b = req.user) === null || _b === void 0 ? void 0 : _b.email,
            message: 'MFA setup initiated. Complete setup by verifying a code.'
        });
    }
    catch (error) {
        console.error('Error setting up MFA:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
/**
 * @route   POST /api/mfa/enable
 * @desc    Verify a code and enable MFA for the user
 * @access  Private
 */
router.post('/enable', authMiddleware_1.authMiddleware.protect, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { code } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!code) {
            return res.status(400).json({ message: 'Verification code is required' });
        }
        // Get the user's stored secret
        const secret = await (0, mfaService_1.getMFASecret)(userId);
        if (!secret) {
            return res.status(400).json({ message: 'MFA setup not initiated. Please generate a secret first.' });
        }
        // Verify the provided code
        const isValid = (0, mfaService_1.verifyTOTP)(secret, code);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        // Enable MFA for the user
        await (0, mfaService_1.enableMFA)(userId);
        return res.json({ message: 'MFA enabled successfully' });
    }
    catch (error) {
        console.error('Error enabling MFA:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
/**
 * @route   POST /api/mfa/disable
 * @desc    Disable MFA for the user (requires verification code)
 * @access  Private
 */
router.post('/disable', authMiddleware_1.authMiddleware.protect, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { code } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!code) {
            return res.status(400).json({ message: 'Verification code is required' });
        }
        // Check if MFA is enabled for the user
        const isEnabled = await (0, mfaService_1.isMFAEnabled)(userId);
        if (!isEnabled) {
            return res.status(400).json({ message: 'MFA is not enabled for this user' });
        }
        // Get the user's stored secret
        const secret = await (0, mfaService_1.getMFASecret)(userId);
        if (!secret) {
            return res.status(500).json({ message: 'MFA secret not found' });
        }
        // Verify the provided code
        const isValid = (0, mfaService_1.verifyTOTP)(secret, code);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        // Disable MFA for the user
        await (0, mfaService_1.disableMFA)(userId);
        return res.json({ message: 'MFA disabled successfully' });
    }
    catch (error) {
        console.error('Error disabling MFA:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
/**
 * @route   POST /api/mfa/verify
 * @desc    Verify a MFA code during login
 * @access  Public
 */
router.post('/verify', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: 'Email and verification code are required' });
        }
        // Find the user
        const user = await dbManager_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // Check if MFA is enabled for the user
        if (!user.mfaEnabled || !user.mfaSecret) {
            return res.status(400).json({ message: 'MFA not enabled for this user' });
        }
        // Verify the provided code
        const isValid = (0, mfaService_1.verifyTOTP)(user.mfaSecret, code);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        // Generate a JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Error verifying MFA code:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=mfaRoutes.js.map