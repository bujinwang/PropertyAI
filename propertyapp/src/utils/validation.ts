// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation - min 8 chars, with at least one uppercase, one lowercase, and one number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\S]{8,}$/;

// Name validation - letters, spaces, hyphens, and apostrophes, 2+ chars
const NAME_REGEX = /^[a-zA-Z\s'-]{2,}$/;

// Phone validation - flexible format
const PHONE_REGEX = /^[\d\s()+.-]{10,15}$/;

/**
 * Validates an email address
 */
export const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return 'Email is required';
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return undefined;
};

/**
 * Validates a password
 */
export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }
  
  return undefined;
};

/**
 * Validates password confirmation
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): string | undefined => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  
  return undefined;
};

/**
 * Validates a name
 */
export const validateName = (name: string): string | undefined => {
  if (!name) {
    return 'Name is required';
  }
  
  if (!NAME_REGEX.test(name)) {
    return 'Please enter a valid name';
  }
  
  return undefined;
};

/**
 * Validates a phone number
 */
export const validatePhone = (phone: string): string | undefined => {
  if (!phone) {
    return 'Phone number is required';
  }
  
  if (!PHONE_REGEX.test(phone)) {
    return 'Please enter a valid phone number';
  }
  
  return undefined;
};

/**
 * Generic required field validation
 */
export const validateRequired = (value: string, fieldName: string): string | undefined => {
  if (!value) {
    return `${fieldName} is required`;
  }
  
  return undefined;
}; 