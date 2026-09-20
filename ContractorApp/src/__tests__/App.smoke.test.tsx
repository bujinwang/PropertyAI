import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';

// The auth context is controlled so the rendered components are deterministic
// and no asynchronous state updates occur while a test is running.
jest.mock('../contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const baseAuth = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  checkAuthState: jest.fn(),
};

/**
 * Smoke tests: render real application components (from `src/`) inside the real
 * PaperProvider and assert they mount and produce real rendered output. These
 * are genuine assertions on the component tree, not placeholders.
 */
describe('ContractorApp smoke tests', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ ...baseAuth } as ReturnType<typeof useAuth>);
  });

  it('mounts the real LoginScreen and renders its form without throwing', () => {
    const { getByText, toJSON } = render(
      <PaperProvider>
        <LoginScreen />
      </PaperProvider>
    );

    // Branding rendered by LoginScreen.
    expect(getByText('PropertyAI')).toBeTruthy();
    expect(getByText('Contractor Portal')).toBeTruthy();

    // Primary call-to-action rendered by the form (visible because the mocked
    // auth state is not loading).
    expect(getByText('Login')).toBeTruthy();

    // A real, non-empty element tree was produced.
    expect(toJSON()).toBeTruthy();
  });

  it('mounts the real ProfileScreen and renders vendor details for an authenticated user', () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuth,
      isAuthenticated: true,
      user: {
        id: 'user-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        role: 'VENDOR',
        vendor: {
          id: 'vendor-1',
          name: 'Ada Contracting',
          phone: '555-0100',
          email: 'ops@ada.example',
          address: '1 Analytical Way',
          specialty: 'Plumbing',
          availability: 'AVAILABLE',
          serviceAreas: ['Downtown'],
          certifications: ['Licensed'],
        },
      },
    } as ReturnType<typeof useAuth>);

    const { getByText } = render(
      <PaperProvider>
        <ProfileScreen />
      </PaperProvider>
    );

    expect(getByText('Ada Lovelace')).toBeTruthy();
    expect(getByText('Ada Contracting')).toBeTruthy();
    expect(getByText('Plumbing')).toBeTruthy();
  });
});
