import React, { useEffect, useState } from 'react';
import tenantScreeningService from '../../services/tenantScreeningService';

interface Alert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  context: Record<string, any>;
}

const severityColors: Record<string, string> = {
  low: '#e0e0e0',
  medium: '#ffe082',
  high: '#ff8a65',
};

const ScreeningAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tenantScreeningService.getScreeningIssueAlerts()
      .then(setAlerts)
      .catch((err) => setError('Failed to fetch alerts'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading alerts...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!alerts.length) return <div>No current screening alerts.</div>;

  return (
    <div>
      <h3>Tenant Screening Issue Alerts</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {alerts.map(alert => (
          <li key={alert.id} style={{
            background: severityColors[alert.severity] || '#f5f5f5',
            borderLeft: `6px solid ${severityColors[alert.severity] || '#bdbdbd'}`,
            margin: '12px 0',
            padding: '12px',
            borderRadius: '4px',
          }}>
            <div><strong>{alert.message}</strong></div>
            <div style={{ fontSize: '0.9em', color: '#555' }}>
              Severity: <span style={{ fontWeight: 'bold' }}>{alert.severity.toUpperCase()}</span> | {new Date(alert.timestamp).toLocaleString()}
            </div>
            {alert.context && (
              <pre style={{ background: '#fafafa', padding: '6px', borderRadius: '3px', fontSize: '0.85em', marginTop: '6px' }}>
                {JSON.stringify(alert.context, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScreeningAlerts; 