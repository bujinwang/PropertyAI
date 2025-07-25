# PropertyAI Contractor App

A React Native mobile application for contractors to manage work orders assigned through the PropertyAI platform.

## Features

### Authentication
- Secure login for vendors with contractor/vendor role
- JWT token-based authentication
- Automatic session management

### Work Order Management
- View all assigned work orders
- Filter work orders by status (Open, Assigned, In Progress, etc.)
- Search work orders by title, description, or property name
- Accept or decline work order assignments
- Update work order status (In Progress, Pending Approval, Completed)
- View detailed work order information including property details

### Quote Submission
- Submit quotes for work orders with pricing and details
- View previously submitted quotes

### Communication
- Integration with messaging system for work order communication
- Push notifications for new assignments and updates

### Property Integration
- View property details and location information
- Open maps for navigation to property location

### Profile Management
- View contractor/vendor profile information
- Company details, specialties, service areas, and certifications
- Availability status management
- Secure logout functionality

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack & Tab navigators)
- **UI Components**: React Native Paper (Material Design)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with Yup validation
- **Secure Storage**: Expo SecureStore
- **Push Notifications**: Expo Notifications
- **Icons**: Expo Vector Icons (Ionicons)

## Project Structure

```
ContractorApp/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication state management
│   ├── screens/
│   │   ├── LoginScreen.tsx          # Login screen
│   │   ├── WorkOrdersScreen.tsx     # Work orders list
│   │   ├── WorkOrderDetailScreen.tsx # Work order details
│   │   └── ProfileScreen.tsx        # User profile
│   ├── services/
│   │   ├── api.ts                   # API service layer
│   │   └── notifications.ts         # Push notification service
│   └── types/
│       └── index.ts                 # TypeScript type definitions
├── App.tsx                          # Main app component
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
└── babel.config.js                  # Babel configuration
```

## API Integration

The app integrates with the PropertyAI backend API with the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Work Orders
- `GET /api/contractor/work-orders` - Get assigned work orders
- `GET /api/contractor/work-orders/:id` - Get work order details
- `POST /api/contractor/work-orders/:id/accept` - Accept work order
- `POST /api/contractor/work-orders/:id/decline` - Decline work order
- `PUT /api/contractor/work-orders/:id/status` - Update work order status
- `POST /api/contractor/work-orders/:id/quote` - Submit quote
- `POST /api/contractor/work-orders/:id/invoice` - Submit invoice

### Messaging
- `GET /api/contractor/work-orders/:id/messages` - Get messages
- `POST /api/contractor/work-orders/:id/messages` - Send message

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   - Set `API_BASE_URL` in your expo configuration or environment

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on device/simulator**:
   ```bash
   npm run ios     # iOS simulator
   npm run android # Android emulator
   ```

## Configuration

### Backend URL
Update the `BASE_URL` in `src/services/api.ts` to point to your PropertyAI backend:

```typescript
const BASE_URL = 'https://your-backend-url.com/api';
```

### Push Notifications
Configure push notifications in your Expo app configuration:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## Security Features

- Secure token storage using Expo SecureStore
- Automatic token refresh handling
- Role-based access (vendor/contractor only)
- Request/response interceptors for authentication

## Key Components

### AuthContext
Manages authentication state, login/logout functionality, and role verification.

### API Service
Centralized HTTP client with automatic token management and error handling.

### Notification Service
Handles push notification setup, permissions, and message handling.

### Navigation
Implements secure navigation with authentication-based screen routing.

## Development Notes

### Authentication Flow
1. User enters credentials on LoginScreen
2. API validates credentials and returns JWT token
3. Token stored securely and user state updated
4. App navigates to main tabs for authenticated contractors
5. All API requests include authentication headers

### Work Order Workflow
1. Contractors receive push notifications for new assignments
2. View work orders in list with filtering/search capabilities
3. Accept or decline assignments
4. Update status as work progresses
5. Submit quotes and communicate through messaging

### Offline Support
The app includes basic offline capabilities:
- Cached authentication state
- Local storage of critical data
- Queue mechanism for status updates when connectivity restored

## Future Enhancements

- Photo capture for work completion evidence
- GPS tracking for job site visits
- Invoice generation and submission
- Offline work order synchronization
- Real-time messaging with WebSocket support
- Calendar integration for scheduling

## Related Documentation

- [Backend API Documentation](../backend/docs/)
- [PropertyAI Architecture Plan](../docs/architectural-plan-ai-triage-contractor-app.md)
- [Contractor Service Documentation](../backend/src/services/contractor.service.ts)
