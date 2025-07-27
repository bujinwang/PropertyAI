import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorMiddleware';

export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName } = req.body;

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  // Password validation
  if (!password || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }

  // Name validation
  if (!firstName || !lastName) {
    return next(new AppError('First name and last name are required', 400));
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  next();
};

export const validateRequest = (validationRules: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Basic validation middleware
    // You can implement specific validation logic here
    next();
  };
};
