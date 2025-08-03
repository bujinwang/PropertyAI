# Legacy Routes Deprecation Notice

## Deprecated Routes (Remove after grace period)

### Property Routes
- `GET /api/properties` → `GET /api/rentals?type=PROPERTY`
- `GET /api/properties/:id` → `GET /api/rentals/:id`
- `POST /api/properties` → `POST /api/rentals` (with type: 'PROPERTY')
- `PUT /api/properties/:id` → `PUT /api/rentals/:id`
- `DELETE /api/properties/:id` → `DELETE /api/rentals/:id`

### Unit Routes
- `GET /api/units` → `GET /api/rentals?type=UNIT`
- `GET /api/units/:id` → `GET /api/rentals/:id`
- `POST /api/units` → `POST /api/rentals` (with type: 'UNIT')
- `PUT /api/units/:id` → `PUT /api/rentals/:id`
- `DELETE /api/units/:id` → `DELETE /api/rentals/:id`

### Listing Routes
- `GET /api/listings` → `GET /api/rentals?isActive=true`
- `GET /api/listings/:id` → `GET /api/rentals/:id`
- `POST /api/listings` → `POST /api/rentals`
- `PUT /api/listings/:id` → `PUT /api/rentals/:id`
- `DELETE /api/listings/:id` → `DELETE /api/rentals/:id`

## Timeline
- **Phase 1**: Add deprecation warnings (✅ Complete)
- **Phase 2**: Remove legacy services and types (🔄 In Progress)
- **Phase 3**: Remove legacy routes (📅 Scheduled for next release)
- **Phase 4**: Remove legacy database tables (📅 After data verification)