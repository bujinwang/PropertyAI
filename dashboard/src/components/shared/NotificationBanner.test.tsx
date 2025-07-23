import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NotificationBanner, { NotificationItem } from './NotificationBanner';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockNotification: NotificationItem = {
  id: '1',
  type: 'info',
  title: 'Test Notification',
  message: 'This is a test notification message',
  priority: 'medium',
  timestamp: new Date('2024-01-01T12:00:00Z'),
  read: false,
  aiGenerated: false
};

const mockAINotification: NotificationItem = {
  ...mockNotification,
  id: '2',
  title: 'AI Generated Insight',
  aiGenerated: true,
  actions: [
    {
      label: 'View Details',
      onClick: jest.fn(),
      variant: 'contained'
    },
    {
      label: 'Dismiss',
      onClick: jest.fn(),
      variant: 'text'
    }
  ]
};

describe('NotificationBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Banner variant', () => {
    it('renders banner notification correctly', () => {
      renderWithTheme(
        <NotificationBanner
          variant="banner"
          notification={mockNotification}
        />
      );

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a test notification message')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('shows AI indicator for AI-generated notifications', () => {
      const { container } = renderWithTheme(
        <NotificationBanner
          variant="banner"
          notification={mockAINotification}
        />
      );

      expect(container.querySelector('[data-testid="AutoAwesomeIcon"]')).toBeInTheDocument();
      expect(screen.getByText('AI Generated Insight')).toBeInTheDocument();
    });

    it('renders action buttons when provided', () => {
      renderWithTheme(
        <NotificationBanner
          variant="banner"
          notification={mockAINotification}
        />
      );

      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      renderWithTheme(
        <NotificationBanner
          variant="banner"
          notification={mockNotification}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledWith(mockNotification.id);
    });

    it('calls action callbacks when action buttons are clicked', () => {
      const onAction = jest.fn();
      const actionCallback = jest.fn();
      
      const notificationWithAction = {
        ...mockNotification,
        actions: [{ label: 'Test Action', onClick: actionCallback }]
      };

      renderWithTheme(
        <NotificationBanner
          variant="banner"
          notification={notificationWithAction}
          onAction={onAction}
        />
      );

      const actionButton = screen.getByText('Test Action');
      fireEvent.click(actionButton);

      expect(actionCallback).toHaveBeenCalled();
      expect(onAction).toHaveBeenCalledWith(mockNotification.id, 0);
    });
  });

  describe('Badge variant', () => {
    it('renders badge with notification count', () => {
      renderWithTheme(
        <NotificationBanner
          variant="badge"
          count={5}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByLabelText('5 unread notifications')).toBeInTheDocument();
    });

    it('shows max count when count exceeds maximum', () => {
      renderWithTheme(
        <NotificationBanner
          variant="badge"
          count={150}
          maxCount={99}
        />
      );

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('shows active notification icon when count > 0', () => {
      const { container } = renderWithTheme(
        <NotificationBanner
          variant="badge"
          count={3}
        />
      );

      expect(container.querySelector('[data-testid="NotificationsActiveIcon"]')).toBeInTheDocument();
    });

    it('shows regular notification icon when count is 0', () => {
      const { container } = renderWithTheme(
        <NotificationBanner
          variant="badge"
          count={0}
        />
      );

      expect(container.querySelector('[data-testid="NotificationsIcon"]')).toBeInTheDocument();
    });
  });

  describe('Message variant', () => {
    const mockNotifications = [
      mockNotification,
      {
        ...mockNotification,
        id: '2',
        title: 'Second Notification',
        priority: 'high' as const,
        read: true
      }
    ];

    it('renders multiple notifications correctly', () => {
      renderWithTheme(
        <NotificationBanner
          variant="message"
          notifications={mockNotifications}
        />
      );

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('Second Notification')).toBeInTheDocument();
    });

    it('shows AI indicator for AI-generated notifications', () => {
      const { container } = renderWithTheme(
        <NotificationBanner
          variant="message"
          notifications={[mockAINotification]}
        />
      );

      expect(container.querySelector('[data-testid="AutoAwesomeIcon"]')).toBeInTheDocument();
    });

    it('displays timestamp correctly', () => {
      renderWithTheme(
        <NotificationBanner
          variant="message"
          notifications={[mockNotification]}
        />
      );

      // The timestamp will be displayed in local timezone, so we just check it exists
      expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
    });

    it('shows mark as read button for unread notifications', () => {
      renderWithTheme(
        <NotificationBanner
          variant="message"
          notifications={[mockNotification]}
        />
      );

      expect(screen.getByText('Mark as read')).toBeInTheDocument();
    });

    it('hides mark as read button for read notifications', () => {
      const readNotification = { ...mockNotification, read: true };
      renderWithTheme(
        <NotificationBanner
          variant="message"
          notifications={[readNotification]}
        />
      );

      expect(screen.queryByText('Mark as read')).not.toBeInTheDocument();
    });

    it('calls onMarkAsRead when mark as read is clicked', () => {
      const onMarkAsRead = jest.fn();
      renderWithTheme(
        <NotificationBanner
          variant="message"
          notifications={[mockNotification]}
          onMarkAsRead={onMarkAsRead}
        />
      );

      const markAsReadButton = screen.getByText('Mark as read');
      fireEvent.click(markAsReadButton);

      expect(onMarkAsRead).toHaveBeenCalledWith(mockNotification.id);
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      renderWithTheme(
        <NotificationBanner
          variant="message"
          notifications={[mockNotification]}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledWith(mockNotification.id);
    });

    it('renders action buttons for notifications with actions', () => {
      renderWithTheme(
        <NotificationBanner
          variant="message"
          notifications={[mockAINotification]}
        />
      );

      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });
  });

  describe('Priority styling', () => {
    it('applies critical priority styling', () => {
      const criticalNotification = { ...mockNotification, priority: 'critical' as const };
      const { container } = renderWithTheme(
        <NotificationBanner
          variant="message"
          notifications={[criticalNotification]}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle('border-left: 4px solid rgb(211, 47, 47)'); // error.main color
    });

    it('applies high priority styling', () => {
      const highNotification = { ...mockNotification, priority: 'high' as const };
      const { container } = renderWithTheme(
        <NotificationBanner
          variant="message"
          notifications={[highNotification]}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle('border-left: 4px solid rgb(237, 108, 2)'); // warning.main color
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for banner variant', () => {
      renderWithTheme(
        <NotificationBanner
          variant="banner"
          notification={mockNotification}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });

    it('has proper ARIA attributes for badge variant', () => {
      renderWithTheme(
        <NotificationBanner
          variant="badge"
          count={5}
        />
      );

      expect(screen.getByLabelText('5 unread notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('notifications')).toBeInTheDocument();
    });

    it('has proper ARIA attributes for message variant', () => {
      renderWithTheme(
        <NotificationBanner
          variant="message"
          notifications={[mockNotification]}
        />
      );

      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('article')).toHaveAttribute('aria-labelledby', 'notification-title-1');
    });
  });

  describe('Different notification types', () => {
    const types = ['info', 'warning', 'error', 'success'] as const;

    types.forEach(type => {
      it(`renders ${type} notification correctly`, () => {
        const notification = { ...mockNotification, type };
        renderWithTheme(
          <NotificationBanner
            variant="banner"
            notification={notification}
          />
        );

        const alert = screen.getByRole('alert');
        expect(alert).toHaveClass(`MuiAlert-color${type.charAt(0).toUpperCase() + type.slice(1)}`);
      });
    });
  });

  describe('Enhanced Features', () => {
    describe('Snooze functionality', () => {
      it('shows snooze button when enableSnooze is true', () => {
        renderWithTheme(
          <NotificationBanner
            variant="banner"
            notification={mockNotification}
            enableSnooze={true}
          />
        );

        expect(screen.getByLabelText('Snooze notification')).toBeInTheDocument();
      });

      it('does not show snooze button when enableSnooze is false', () => {
        renderWithTheme(
          <NotificationBanner
            variant="banner"
            notification={mockNotification}
            enableSnooze={false}
          />
        );

        expect(screen.queryByLabelText('Snooze notification')).not.toBeInTheDocument();
      });

      it('opens snooze menu when snooze button is clicked', () => {
        renderWithTheme(
          <NotificationBanner
            variant="banner"
            notification={mockNotification}
            enableSnooze={true}
          />
        );

        const snoozeButton = screen.getByLabelText('Snooze notification');
        fireEvent.click(snoozeButton);

        expect(screen.getByText('5 minutes')).toBeInTheDocument();
        expect(screen.getByText('15 minutes')).toBeInTheDocument();
        expect(screen.getByText('30 minutes')).toBeInTheDocument();
        expect(screen.getByText('1 hour')).toBeInTheDocument();
      });

      it('calls onSnooze when snooze option is selected', () => {
        const onSnooze = jest.fn();
        renderWithTheme(
          <NotificationBanner
            variant="banner"
            notification={mockNotification}
            enableSnooze={true}
            onSnooze={onSnooze}
          />
        );

        const snoozeButton = screen.getByLabelText('Snooze notification');
        fireEvent.click(snoozeButton);

        const fiveMinutesOption = screen.getByText('5 minutes');
        fireEvent.click(fiveMinutesOption);

        expect(onSnooze).toHaveBeenCalledWith(mockNotification.id, 5);
      });

      it('shows snooze button in message variant', () => {
        renderWithTheme(
          <NotificationBanner
            variant="message"
            notifications={[mockNotification]}
            enableSnooze={true}
          />
        );

        expect(screen.getByLabelText('Snooze notification')).toBeInTheDocument();
      });
    });

    describe('Message limiting', () => {
      const manyNotifications = Array.from({ length: 10 }, (_, i) => ({
        ...mockNotification,
        id: `notification-${i}`,
        title: `Notification ${i + 1}`
      }));

      it('limits visible messages to maxVisibleMessages', () => {
        renderWithTheme(
          <NotificationBanner
            variant="message"
            notifications={manyNotifications}
            maxVisibleMessages={3}
          />
        );

        expect(screen.getByText('Notification 1')).toBeInTheDocument();
        expect(screen.getByText('Notification 2')).toBeInTheDocument();
        expect(screen.getByText('Notification 3')).toBeInTheDocument();
        expect(screen.queryByText('Notification 4')).not.toBeInTheDocument();
      });

      it('shows "Show More" button when there are more notifications', () => {
        renderWithTheme(
          <NotificationBanner
            variant="message"
            notifications={manyNotifications}
            maxVisibleMessages={3}
          />
        );

        expect(screen.getByText('Show 7 More')).toBeInTheDocument();
      });

      it('expands to show all notifications when "Show More" is clicked', () => {
        renderWithTheme(
          <NotificationBanner
            variant="message"
            notifications={manyNotifications}
            maxVisibleMessages={3}
          />
        );

        const showMoreButton = screen.getByText('Show 7 More');
        fireEvent.click(showMoreButton);

        expect(screen.getByText('Notification 4')).toBeInTheDocument();
        expect(screen.getByText('Notification 10')).toBeInTheDocument();
        expect(screen.getByText('Show Less')).toBeInTheDocument();
      });

      it('collapses notifications when "Show Less" is clicked', () => {
        renderWithTheme(
          <NotificationBanner
            variant="message"
            notifications={manyNotifications}
            maxVisibleMessages={3}
          />
        );

        // First expand
        const showMoreButton = screen.getByText('Show 7 More');
        fireEvent.click(showMoreButton);

        // Then collapse
        const showLessButton = screen.getByText('Show Less');
        fireEvent.click(showLessButton);

        expect(screen.queryByText('Notification 4')).not.toBeInTheDocument();
        expect(screen.getByText('Show 7 More')).toBeInTheDocument();
      });
    });

    describe('Notification grouping', () => {
      const groupableNotifications = [
        { ...mockNotification, id: '1', type: 'info' as const, priority: 'medium' as const },
        { ...mockNotification, id: '2', type: 'info' as const, priority: 'medium' as const },
        { ...mockNotification, id: '3', type: 'warning' as const, priority: 'high' as const },
        { ...mockNotification, id: '4', type: 'warning' as const, priority: 'high' as const },
      ];

      it('groups notifications by type and priority when enableGrouping is true', () => {
        renderWithTheme(
          <NotificationBanner
            variant="message"
            notifications={groupableNotifications}
            enableGrouping={true}
          />
        );

        expect(screen.getByText('2 info notifications')).toBeInTheDocument();
        expect(screen.getByText('2 warning notifications')).toBeInTheDocument();
      });

      it('does not group notifications when enableGrouping is false', () => {
        renderWithTheme(
          <NotificationBanner
            variant="message"
            notifications={groupableNotifications}
            enableGrouping={false}
          />
        );

        expect(screen.getAllByText('Test Notification')).toHaveLength(4);
      });
    });

    describe('Custom snooze options', () => {
      it('uses custom snooze options when provided', () => {
        const customSnoozeOptions = [10, 30, 120]; // 10 min, 30 min, 2 hours
        renderWithTheme(
          <NotificationBanner
            variant="banner"
            notification={mockNotification}
            enableSnooze={true}
            snoozeOptions={customSnoozeOptions}
          />
        );

        const snoozeButton = screen.getByLabelText('Snooze notification');
        fireEvent.click(snoozeButton);

        expect(screen.getByText('10 minutes')).toBeInTheDocument();
        expect(screen.getByText('30 minutes')).toBeInTheDocument();
        expect(screen.getByText('2 hours')).toBeInTheDocument();
        expect(screen.queryByText('5 minutes')).not.toBeInTheDocument();
      });
    });
  });
});