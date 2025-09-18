import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TemplateApplier from './TemplateApplier';
import TemplateService from '../../../src/services/epic23/TemplateService'; // Mock

// Mock TemplateService
jest.mock('../../../src/services/epic23/TemplateService', () => ({
  getTemplates: jest.fn(),
  applyTemplate: jest.fn((layout, available) => layout.filter(l => available.includes(l.type))),
}));

const mockGetTemplates = TemplateService.getTemplates as jest.Mock;
const availableComponents = ['MaintenanceAlerts', 'Chart'];

describe('TemplateApplier', () => {
  const userId = 'test-user';
  const role = 'manager';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when no template', async () => {
    mockGetTemplates.mockResolvedValueOnce([]);
    render(<TemplateApplier userId={userId} role={role} availableComponents={availableComponents}>
      <div data-testid="default-content">Default Content</div>
    </TemplateApplier>);

    expect(screen.getByTestId('default-content')).toBeInTheDocument();
  });

  it('loads and applies template layout', async () => {
    mockGetTemplates.mockResolvedValueOnce([{ id: 'test-template', layout: [{ type: 'MaintenanceAlerts' }, { type: 'Unknown' }] }]);
    render(<TemplateApplier templateId="test-template" userId={userId} role={role} availableComponents={availableComponents}>
      <div data-testid="default">Default</div>
    </TemplateApplier>);

    await waitFor(() => {
      expect(screen.getByText('MaintenanceAlerts')).toBeInTheDocument(); // From layout
    });
    expect(screen.queryByTestId('default')).not.toBeInTheDocument(); // Overridden
  });

  it('falls back to children when template load fails', async () => {
    mockGetTemplates.mockRejectedValueOnce(new Error('Load failed'));
    render(<TemplateApplier templateId="fail" userId={userId} role={role} availableComponents={availableComponents}>
      <div data-testid="fallback">Fallback Content</div>
    </TemplateApplier>);

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  it('renders loading state while fetching template', () => {
    mockGetTemplates.mockImplementation(() => new Promise(() => {})); // Pending
    const { container } = render(<TemplateApplier templateId="loading" userId={userId} role={role} availableComponents={availableComponents}>
      <div>Content</div>
    </TemplateApplier>);

    expect(container.textContent).toContain('Loading template...');
  });
});