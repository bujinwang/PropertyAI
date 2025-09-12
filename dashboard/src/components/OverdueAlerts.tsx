import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardContent,
  Alert,
  AlertTitle,
  Typography,
  Skeleton,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { queryKeys } from '../config/queryClient';
import { dashboardService, OverduePayment } from '../services/dashboardService';

const OverdueAlerts: React.FC = () => {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const { data: overduePayments, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.overduePayments(),
    queryFn: () => dashboardService.getOverduePayments(),
  });

  const activeAlerts = overduePayments?.filter((payment) => !dismissedAlerts.has(payment.id)) || [];

  const handleDismiss = (id: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(id));
  };

  const handleAcknowledge = (id: string) => {
    console.log('Acknowledge payment:', id);
    // In a real app, this would update the payment status via API
    handleDismiss(id);
  };

  const getSeverity = (daysOverdue: number) => {
    if (daysOverdue >= 30) return 'error';
    if (daysOverdue >= 14) return 'warning';
    return 'info';
  };

  const getDaysText = (days: number) => {
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader
          title={<Skeleton variant="text" width="40%" aria-label="Loading overdue payments" />}
          subheader={<Skeleton variant="text" width="60%" />}
        />
        <CardContent>
          <Skeleton variant="rectangular" height={100} aria-label="Loading overdue payments content" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Overdue Payments Alerts" />
        <CardContent>
          <Alert severity="error" role="alert" aria-live="polite">
            Failed to load overdue payments: {(error as Error).message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Overdue Payments Alerts"
        subheader={
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={activeAlerts.length}
              color={activeAlerts.length > 0 ? 'error' : 'success'}
              size="small"
              aria-label={`${activeAlerts.length} overdue payment alerts`}
            />
            <Typography variant="body2" color="text.secondary">
              {activeAlerts.length} alert{activeAlerts.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        }
      />
      <CardContent>
        {activeAlerts.length === 0 ? (
          <Alert severity="success" icon={<PaymentIcon />} role="status">
            <AlertTitle>No overdue payments</AlertTitle>
            All tenants are current on their payments.
          </Alert>
        ) : (
          <Box display="flex" flexDirection="column" gap={2} role="list" aria-label="Overdue payment alerts">
            {activeAlerts.map((payment: OverduePayment) => (
              <Alert
                key={payment.id}
                severity={getSeverity(payment.daysOverdue)}
                icon={<WarningIcon />}
                action={
                  <Box display="flex" gap={1}>
                    <Tooltip title="Acknowledge payment">
                      <IconButton
                        size="small"
                        onClick={() => handleAcknowledge(payment.id)}
                        aria-label={`Acknowledge payment for Unit ${payment.unitNumber}`}
                      >
                        <PaymentIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Dismiss alert">
                      <IconButton
                        size="small"
                        onClick={() => handleDismiss(payment.id)}
                        aria-label={`Dismiss alert for Unit ${payment.unitNumber}`}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
                role="listitem"
              >
                <AlertTitle>
                  Unit {payment.unitNumber}: {payment.tenantName}
                </AlertTitle>
                <Typography variant="body2">
                  Rent payment of ${payment.amount} is {getDaysText(payment.daysOverdue)} overdue.
                  Due date: {new Date(payment.dueDate).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Payment method: {payment.paymentMethod}
                </Typography>
              </Alert>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default OverdueAlerts;