import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ChartWidget from './ChartWidget';
import { WidgetConfig, TrendData } from '../services/dashboardService';

// Mock chart components
jest.mock('./charts', () => ({
  LineChart: ({ title, data, height, loading, ...props }: any) => (
    <div data-testid="line-chart" data-title={title} data-loading={loading}>
      Line Chart Mock: {data?.length || 0} items, height {height}
    </div>
  ),
  BarChart: ({ title, data, height, loading, ...props }: any) => (
    <div data-testid="bar-chart" data-title={title} data-loading={loading}>
      Bar Chart Mock: {data?.length || 0} items, height {height}
    </div>
  ),
  PieChart: ({ title, data, height, loading, ...props }: any) => (
    <div data-testid="pie-chart" data-title={title} data-loading={loading}>
      Pie Chart Mock: {data?.length || 0} items, height {height}
    </div>
  ),
  HeatMap: ({ title, data, height, loading, ...props }: any) => (
    <div data-testid="heat-map" data-title={title} data-loading={loading}>
      Heat Map Mock: {data?.length || 0} items, height {height}
    </div>
  ),
}));

const theme = createTheme();

const mockWidget: WidgetConfig = {
  id: 'test-widget',
  type: 'line-chart',
  title: 'Test Chart',
  position: { x: 0, y: 0, w: 4, h: 3 },
  dataSource: 'test-source',
  filters: {},
  settings: { showFooter: true },
};

const mockData: TrendData[] = [
  { date: '2023-01-01', value: 100, label: 'Jan' },
  { date: '2023-01-02', value: 150, label: 'Feb' },
];

const renderWithTheme = (component: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);

describe('ChartWidget', () => {
  test('renders line chart with data', () => {
    renderWithTheme(
      <ChartWidget
        widget={mockWidget}
        data={mockData}
        onRefresh={jest.fn()}
        onFullscreen={jest.fn()}
        onSettings={jest.fn()}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toHaveAttribute('data-title', '');
    expect(screen.getByTestId('line-chart')).toHaveAttribute('data-loading', 'false');
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
  });

  test('renders bar chart when type is bar-chart', () => {
    const barWidget = { ...mockWidget, type: 'bar-chart' };
    renderWithTheme(
      <ChartWidget
        widget={barWidget}
        data={mockData}
        onRefresh={jest.fn()}
        onFullscreen={jest.fn()}
        onSettings={jest.fn()}
      />
    );

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  test('renders pie chart when type is pie-chart', () => {
    const pieWidget = { ...mockWidget, type: 'pie-chart' };
    renderWithTheme(
      <ChartWidget
        widget={pieWidget}
        data={mockData}
        onRefresh={jest.fn()}
        onFullscreen={jest.fn()}
        onSettings={jest.fn()}
      />
    );

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  test('renders heat map when type is heat-map', () => {
    const heatWidget = { ...mockWidget, type: 'heat-map' };
    renderWithTheme(
      <ChartWidget
        widget={heatWidget}
        data={mockData}
        onRefresh={jest.fn()}
        onFullscreen={jest.fn()}
        onSettings={jest.fn()}
      />
    );

    expect(screen.getByTestId('heat-map')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    renderWithTheme(
      <ChartWidget
        widget={mockWidget}
        data={mockData}
        loading={true}
        onRefresh={jest.fn()}
        onFullscreen={jest.fn()}
        onSettings={jest.fn()}
      />
    );

    // MUI Skeleton would be rendered, but since mocked, check for loading attr
    expect(screen.getByTestId('line-chart')).toHaveAttribute('data-loading', 'true');
  });

  test('shows error state', () => {
    renderWithTheme(
      <ChartWidget
        widget={mockWidget}
        data={mockData}
        error="Test error"
        onRefresh={jest.fn()}
        onFullscreen={jest.fn()}
        onSettings={jest.fn()}
      />
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  test('shows unsupported type message', () => {
    const unsupportedWidget = { ...mockWidget, type: 'unsupported' as any };
    renderWithTheme(
      <ChartWidget
        widget={unsupportedWidget}
        data={mockData}
        onRefresh={jest.fn()}
        onFullscreen={jest.fn()}
        onSettings={jest.fn()}
      />
    );

    expect(screen.getByText('Unsupported chart type: unsupported')).toBeInTheDocument();
  });

  test('action buttons appear on hover (via class)', () => {
    renderWithTheme(
      <ChartWidget
        widget={mockWidget}
        data={mockData}
        onRefresh={jest.fn()}
        onFullscreen={jest.fn()}
        onSettings={jest.fn()}
      />
    );

    // Since hover is CSS, test presence
    const refreshIcon = screen.getByLabelText('Refresh');
    const settingsIcon = screen.getByLabelText('Settings');
    const fullscreenIcon = screen.getByLabelText('Fullscreen');

    expect(refreshIcon).toBeInTheDocument();
    expect(settingsIcon).toBeInTheDocument();
    expect(fullscreenIcon).toBeInTheDocument();
  });

  test('handles refresh click', () => {
    const mockRefresh = jest.fn();
    renderWithTheme(
      <ChartWidget
        widget={mockWidget}
        data={mockData}
        onRefresh={mockRefresh}
        onFullscreen={jest.fn()}
        onSettings={jest.fn()}
      />
    );

    const refreshButton = screen.getByLabelText('Refresh');
    fireEvent.click(refreshButton);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  test('shows footer when enabled', () => {
    const widgetWithFooter = { ...mockWidget, settings: { showFooter: true } };
    renderWithTheme(
      <ChartWidget
        widget={widgetWithFooter}
        data={mockData}
        onRefresh={jest.fn()}
        onFullscreen={jest.fn()}
        onSettings={jest.fn()}
      />
    );

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  test('footer not shown when disabled', () => {
    const widgetNoFooter = { ...mockWidget, settings: { showFooter: false } };
    renderWithTheme(
      <ChartWidget
        widget={widgetNoFooter}
        data={mockData}
        onRefresh={jest.fn()}
        onFullscreen={jest.fn()}
        onSettings={jest.fn()}
      />
    );

    expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();
  });
});