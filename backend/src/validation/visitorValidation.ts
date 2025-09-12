
import { body, param, query } from 'express-validator';

export const createVisitorValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('visitDate')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid visit date'),
  body('visitTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time in HH:MM format'),
  body('purpose')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Purpose must be between 5 and 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

export const updateVisitorValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid visitor ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('visitDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid visit date'),
  body('visitTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time in HH:MM format'),
  body('purpose')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Purpose must be between 5 and 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

export const createDeliveryValidation = [
  body('trackingNumber')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Tracking number must be between 5 and 50 characters'),
  body('carrier')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Carrier name must be between 2 and 50 characters'),
  body('sender')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Sender name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Description must be between 5 and 500 characters'),
  body('recipientName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Recipient name must be between 2 and 100 characters'),
  body('recipientPhone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid recipient phone number'),
  body('rentalId')
    .isUUID()
    .withMessage('Invalid rental ID')
];

export const updateDeliveryValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid delivery ID'),
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Tracking number must be between 5 and 50 characters'),
  body('carrier')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Carrier name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Description must be between 5 and 500 characters'),
  body('recipientName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Recipient name must be between 2 and 100 characters'),
  body('recipientPhone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid recipient phone number'),
  body('rentalId')
    .optional()
    .isUUID()
    .withMessage('Invalid rental ID')
];

export const accessLogValidation = [
  body('visitorId')
    .isUUID()
    .withMessage('Invalid visitor ID'),
  body('accessType')
    .isIn(['ENTRY', 'EXIT'])
    .withMessage('Access type must be either ENTRY or EXIT'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('verifiedBy')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Verified by cannot exceed 50 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

export const deliveryAccessLogValidation = [
  body('deliveryId')
    .isUUID()
    .withMessage('Invalid delivery ID'),
  body('accessType')
    .isIn(['DELIVERED', 'PICKED_UP'])
    .withMessage('Access type must be either DELIVERED or PICKED_UP'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('verifiedBy')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Verified by cannot exceed 50 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];