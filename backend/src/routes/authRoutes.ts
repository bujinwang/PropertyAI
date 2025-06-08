import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middleware/authMiddleware';
import mfaService from '../services/mfaService';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;
    
    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || 'TENANT', // Default to TENANT if no role provided
      }
    });
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '1d' }
    );
    
    // Return user data without password
    res.status(201).json({
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
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token, or prompt for MFA if enabled
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check if MFA is enabled
    if (user?.mfaEnabled) {
      // If MFA is enabled, return a flag indicating MFA is required
      return res.json({
        requireMFA: true,
        email: user.email,
        message: 'MFA verification required'
      });
    }
    
    // If MFA is not enabled, generate and return JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '1d' }
    );
    
    // Return user data without password
    res.json({
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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', authMiddleware.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get user data without password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
        isActive: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (e.g., by clearing session or token)
 * @access  Private
 */
router.post('/logout', authMiddleware.verifyToken, (req: Request, res: Response, next: NextFunction) => {
  // In a token-based system, logout is typically handled on the client-side by deleting the token.
  // For session-based systems, you would destroy the session.
  // req.logout(); // If using sessions
  res.json({ message: 'Logout successful' });
});

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request a password reset
 * @access  Public
 */
router.post('/request-password-reset', async (req, res) => {
  // In a real application, this would generate a token and send an email.
  // For this example, we'll just return a success message.
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  console.log(`Password reset requested for ${email}`);
  res.json({ message: 'Password reset email sent' });
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with a valid token
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
  // In a real application, this would validate the token and update the password.
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }
  console.log(`Password has been reset with token ${token}`);
  res.json({ message: 'Password has been reset successfully' });
});

/**
 * @route   POST /api/auth/enable-mfa
 * @desc    Enable MFA for the authenticated user
 * @access  Private
 */
router.post('/enable-mfa', authMiddleware.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const secret = mfaService.generateSecret();
    await mfaService.enableMFA(userId, secret);

    // In a real app, you'd return the secret via a QR code for the user to scan
    res.json({ message: 'MFA enabled successfully. Please save your secret.', secret });
  } catch (error) {
    console.error('Enable MFA error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/verify-mfa
 * @desc    Verify the MFA code and issue a token
 * @access  Public
 */
router.post('/verify-mfa', async (req: Request, res: Response) => {
  try {
    const { email, mfaCode } = req.body;
    if (!email || !mfaCode) {
      return res.status(400).json({ message: 'Email and MFA code are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.mfaSecret) {
      return res.status(400).json({ message: 'Invalid credentials or MFA not enabled' });
    }

    const isValid = mfaService.verifyTOTP(user.mfaSecret!, mfaCode);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid MFA code' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    res.json({
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
    console.error('MFA verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/disable-mfa
 * @desc    Disable MFA for the authenticated user
 * @access  Private
 */
router.post('/disable-mfa', authMiddleware.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await mfaService.disableMFA(userId);
    res.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    console.error('Disable MFA error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;