import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { 
  isMFAEnabled, 
  generateMFASecret, 
  getMFASecret, 
  verifyTOTP, 
  enableMFA, 
  disableMFA 
} from '../services/mfaService';
import { prisma } from '../utils/dbManager';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * @route   GET /api/mfa/status
 * @desc    Get the MFA status for the authenticated user
 * @access  Private
 */
router.get('/status', authMiddleware.protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const isEnabled = await isMFAEnabled(userId);
    
    return res.json({ mfaEnabled: isEnabled });
  } catch (error) {
    console.error('Error getting MFA status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/mfa/setup
 * @desc    Generate and save a new MFA secret for the user
 * @access  Private
 */
router.post('/setup', authMiddleware.protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Generate a new secret
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const secret = await generateMFASecret((req as any).user.email);
    
    // Store the secret for the user (but don't enable MFA yet)
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.secret }
    });
    
    // Return the secret to be displayed to the user
    return res.json({ 
      secret,
      // Include the user's email for QR code generation on the client side
      email: req.user?.email,
      message: 'MFA setup initiated. Complete setup by verifying a code.' 
    });
  } catch (error) {
    console.error('Error setting up MFA:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/mfa/enable
 * @desc    Verify a code and enable MFA for the user
 * @access  Private
 */
router.post('/enable', authMiddleware.protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { code } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }
    
    // Get the user's stored secret
    const secret = await getMFASecret(userId);
    
    if (!secret) {
      return res.status(400).json({ message: 'MFA setup not initiated. Please generate a secret first.' });
    }
    
    // Verify the provided code
    const isValid = verifyTOTP(secret, code);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Enable MFA for the user
    await enableMFA(userId);
    
    return res.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    console.error('Error enabling MFA:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/mfa/disable
 * @desc    Disable MFA for the user (requires verification code)
 * @access  Private
 */
router.post('/disable', authMiddleware.protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { code } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }
    
    // Check if MFA is enabled for the user
    const isEnabled = await isMFAEnabled(userId);
    
    if (!isEnabled) {
      return res.status(400).json({ message: 'MFA is not enabled for this user' });
    }
    
    // Get the user's stored secret
    const secret = await getMFASecret(userId);
    
    if (!secret) {
      return res.status(500).json({ message: 'MFA secret not found' });
    }
    
    // Verify the provided code
    const isValid = verifyTOTP(secret, code);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Disable MFA for the user
    await disableMFA(userId);
    
    return res.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    console.error('Error disabling MFA:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/mfa/verify
 * @desc    Verify a MFA code during login
 * @access  Public
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
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
    const isValid = verifyTOTP(user.mfaSecret, code);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '1d' }
    );
    
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
  } catch (error) {
    console.error('Error verifying MFA code:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
