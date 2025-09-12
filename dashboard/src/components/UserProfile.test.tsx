import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfile from './UserProfile';
import { dashboardService } from '../services/dashboardService';

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getUser: jest.fn(),
    updateUser: jest.fn(),
  },
}));

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

describe('UserProfile', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    roleId: 'admin-role',
    status: 'active' as const,
    lastLogin: '2024-01-15T10:00:00Z',
    phone: '+1234567890',
    profileImage: 'profile.jpg',
    preferences: {
      theme: 'light' as const,
      notifications: { email: true, inApp: true, sms: false },
      language: 'en',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDashboardService.getUser.mockResolvedValue(mockUser);
  });

  it('renders profile form correctly', async () => {
    render(<UserProfile open onClose={() => {}} userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit User Profile')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('renders own profile with different title', async () => {
    render(<UserProfile open onClose={() => {}} userId="1" isOwnProfile />);

    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });
  });

  it('loads user data on mount', () => {
    render(<UserProfile open onClose={() => {}} userId="1" />);

    expect(mockDashboardService.getUser).toHaveBeenCalledWith('1');
  });

  it('displays profile image', async () => {
    render(<UserProfile open onClose={() => {}} userId="1" />);

    await waitFor(() => {
      const avatar = screen.getByRole('img', { hidden: true });
      expect(avatar).toHaveAttribute('src', 'profile.jpg');
    });
  });

  it('handles profile image upload', async () => {
    render(<UserProfile open onClose={() => {}} userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit User Profile')).toBeInTheDocument();
    });

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/profile-image/i) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    // Check if image preview is updated (mocked)
    await waitFor(() => {
      expect(input.files?.[0]).toBe(file);
    });
  });

  it('validates required fields', async () => {
    render(<UserProfile open onClose={() => {}} userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit User Profile')).toBeInTheDocument();
    });

    // Clear required fields
    const nameField = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameField, { target: { value: '' } });

    const emailField = screen.getByDisplayValue('john@example.com');
    fireEvent.change(emailField, { target: { value: '' } });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('submits form successfully', async () => {
    const mockOnSubmitSuccess = jest.fn();
    mockDashboardService.updateUser.mockResolvedValue(mockUser);

    render(
      <UserProfile
        open
        onClose={() => {}}
        onSubmitSuccess={mockOnSubmitSuccess}
        userId="1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Edit User Profile')).toBeInTheDocument();
    });

    // Change name
    const nameField = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameField, { target: { value: 'Jane Doe' } });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockDashboardService.updateUser).toHaveBeenCalledWith('1', {
        name: 'Jane Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        profileImage: 'profile.jpg',
        preferences: mockUser.preferences,
      });
      expect(mockOnSubmitSuccess).toHaveBeenCalled();
    });
  });

  it('handles theme preference change', async () => {
    render(<UserProfile open onClose={() => {}} userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit User Profile')).toBeInTheDocument();
    });

    const themeSelect = screen.getByLabelText('Theme');
    fireEvent.mouseDown(themeSelect);
    const darkOption = screen.getByText('Dark');
    fireEvent.click(darkOption);

    expect(themeSelect).toHaveValue('dark');
  });

  it('handles language preference change', async () => {
    render(<UserProfile open onClose={() => {}} userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit User Profile')).toBeInTheDocument();
    });

    const languageSelect = screen.getByLabelText('Language');
    fireEvent.mouseDown(languageSelect);
    const spanishOption = screen.getByText('Spanish');
    fireEvent.click(spanishOption);

    expect(languageSelect).toHaveValue('es');
  });

  it('handles notification preferences', async () => {
    render(<UserProfile open onClose={() => {}} userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit User Profile')).toBeInTheDocument();
    });

    const emailSwitch = screen.getByLabelText('Email Notifications');
    const smsSwitch = screen.getByLabelText('SMS Notifications');

    // Email should be checked initially
    expect(emailSwitch).toBeChecked();

    // SMS should be unchecked initially
    expect(smsSwitch).not.toBeChecked();

    // Toggle SMS
    fireEvent.click(smsSwitch);
    expect(smsSwitch).toBeChecked();

    // Toggle email off
    fireEvent.click(emailSwitch);
    expect(emailSwitch).not.toBeChecked();
  });

  it('handles API errors', async () => {
    mockDashboardService.updateUser.mockRejectedValue(new Error('API Error'));

    render(<UserProfile open onClose={() => {}} userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit User Profile')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel is clicked', () => {
    const mockOnClose = jest.fn();
    render(<UserProfile open onClose={mockOnClose} userId="1" />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state when fetching user', () => {
    mockDashboardService.getUser.mockImplementation(() => new Promise(() => {}));

    render(<UserProfile open onClose={() => {}} userId="1" />);

    expect(screen.getByText('Loading user profile...')).toBeInTheDocument();
  });

  it('handles missing userId', () => {
    render(<UserProfile open onClose={() => {}} />);

    expect(mockDashboardService.getUser).not.toHaveBeenCalled();
  });
});