/**
 * @deprecated This type definition has been removed. Use Rental interface instead.
 * All property functionality is now handled through the unified Rental model.
 * 
 * Migration guide:
 * - Property interface → Rental interface with type: 'PROPERTY'
 * - CreatePropertyRequest → CreateRentalDto with type: 'PROPERTY'
 * - UpdatePropertyRequest → UpdateRentalDto
 */

import { Rental } from './rental';

console.error('Property types have been removed. Please use Rental interface instead.');

export interface Property extends Rental {
  /** @deprecated Use Rental interface directly */
}

export interface CreatePropertyRequest {
  /** @deprecated Use CreateRentalDto instead */
}

export interface UpdatePropertyRequest {
  /** @deprecated Use UpdateRentalDto instead */
}

// Re-export for backward compatibility during transition
export { Rental as PropertyReplacement } from './rental';
