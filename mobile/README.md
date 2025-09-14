# PropertyAI Mobile App

A comprehensive React Native mobile application for property management, built with Expo and TypeScript.

## Features

### 🔐 Authentication
- Secure login/logout with JWT tokens
- User registration and profile management
- Biometric authentication support
- Multi-factor authentication (MFA)
- OAuth integration (Google, Facebook)

### 🏠 Property Management
- Property listing and details view
- Unit management with search/filter
- Real-time property analytics
- Photo upload and management

### 🔧 Maintenance Tracking
- Maintenance request creation and tracking
- Work order management
- Contractor communication
- Photo evidence upload
- Status updates and notifications

### 💳 Payment Processing
- Rent collection and payment processing
- Multiple payment methods (cards, bank accounts)
- Payment history and receipts
- Recurring payment setup
- Integration with Stripe and PayPal

### 📱 Mobile Features
- Offline data synchronization
- Push notifications with Firebase
- Dark mode support
- Responsive design for all devices
- Accessibility compliance (WCAG 2.1 AA)

## Tech Stack

- **Framework**: React Native 0.74.5 with Expo SDK 53
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **UI Components**: React Native Paper (Material Design)
- **Database**: SQLite for offline storage
- **Authentication**: JWT with secure storage
- **Push Notifications**: Firebase Cloud Messaging
- **Testing**: Jest + React Native Testing Library
- **Build**: EAS Build for iOS and Android

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts for state management
│   ├── navigation/         # Navigation configuration
│   ├── screens/           # Screen components
│   │   ├── auth/          # Authentication screens
│   │   └── main/          # Main app screens
│   ├── services/          # API services and utilities
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── constants/         # App constants and configuration
│   └── hooks/             # Custom React hooks
├── assets/                # Static assets (images, fonts)
├── __tests__/            # Test files
├── App.tsx               # Main app component
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Testing configuration
└── metro.config.js       # Metro bundler configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Emulator
- EAS CLI (for builds)

### Installation

1. **Install dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Run on device/simulator**:
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web
   npm run web
   ```

### Build for Production

1. **Install EAS CLI**:
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Configure EAS**:
   ```bash
   eas login
   eas build:configure
   ```

3. **Build for platforms**:
   ```bash
   # iOS
   npm run build:ios

   # Android
   npm run build:android
   ```

## API Integration

The app integrates with the PropertyAI backend API. Key endpoints include:

- **Authentication**: `/api/auth/*`
- **Properties**: `/api/rentals`
- **Maintenance**: `/api/maintenance`
- **Payments**: `/api/payments`
- **Users**: `/api/users`

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Security Features

- **Secure Storage**: Sensitive data stored using Expo SecureStore
- **Certificate Pinning**: SSL certificate validation
- **Biometric Authentication**: Device biometric support
- **Data Encryption**: Sensitive data encrypted at rest
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API request rate limiting

## Offline Support

- **SQLite Database**: Local data storage for offline functionality
- **Data Synchronization**: Automatic sync when connectivity restored
- **Conflict Resolution**: Handle data conflicts during sync
- **Queue Management**: Offline action queuing and retry logic

## Accessibility

- **WCAG 2.1 AA Compliance**: Full accessibility support
- **Screen Reader Support**: VoiceOver and TalkBack compatibility
- **High Contrast Support**: Improved visibility for users with visual impairments
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus indicators and management

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Update documentation as needed
4. Ensure accessibility compliance
5. Test on both iOS and Android platforms

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs`

## Related Documentation

- [Backend API Documentation](../backend/docs/)
- [PropertyAI Architecture](../docs/architectural-plan-ai-triage-contractor-app.md)
- [Security Guidelines](../SECURITY.md)
- [Contributing Guidelines](../CONTRIBUTING.md)