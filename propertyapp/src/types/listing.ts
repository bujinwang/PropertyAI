/**
 * @deprecated This type definition has been removed. Use Rental interface instead.
 * All listing functionality is now handled through the unified Rental model.
 * 
 * Migration guide:
 * - Listing interface → Rental interface with isActive: true
 * - CreateListingRequest → CreateRentalDto
 * - UpdateListingRequest → UpdateRentalDto
 */

import { Rental } from './rental';

console.error('Listing types have been removed. Please use Rental interface instead.');

export interface Listing extends Rental {
  /** @deprecated Use Rental interface directly */
}

export interface CreateListingRequest {
  /** @deprecated Use CreateRentalDto instead */
}

export interface UpdateListingRequest {
  /** @deprecated Use UpdateRentalDto instead */
}

// Re-export for backward compatibility during transition
export { Rental as ListingReplacement } from './rental';