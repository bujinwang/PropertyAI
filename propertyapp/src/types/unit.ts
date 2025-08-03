/**
 * @deprecated This type definition has been removed. Use Rental interface instead.
 * All unit functionality is now handled through the unified Rental model.
 * 
 * Migration guide:
 * - Unit interface → Rental interface with unitNumber field
 * - CreateUnitRequest → CreateRentalDto with type: 'UNIT'
 * - UpdateUnitRequest → UpdateRentalDto
 */

import { Rental } from './rental';

console.error('Unit types have been removed. Please use Rental interface instead.');

export interface Unit extends Rental {
  /** @deprecated Use Rental interface directly */
}

export interface CreateUnitRequest {
  /** @deprecated Use CreateRentalDto instead */
}

export interface UpdateUnitRequest {
  /** @deprecated Use UpdateRentalDto instead */
}

// Re-export for backward compatibility during transition
export { Rental as UnitReplacement } from './rental';