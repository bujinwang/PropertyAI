/**
 * Line Chart Component
 *
 * Advanced line chart for time series data visualization
 * Supports multiple series, trend lines, and interactive features
 */

import React, { useRef, useEffect, useState } from 'react';
import './Chart.css';

interface DataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  metadata?: Record<string, any>;
}

interface Series {
  id: string;
  name: string;
  data: DataPoint[];
  color: string;
  strokeWidth?: number;
  dashArray?: string;
  showPoints?: boolean;
  fill?: boolean;
  fillOpacity?: number;
}

interface LineChartProps {
  series: Series[];
  width?: number;
  height?: number;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  className?: string;
  onPointClick?: (seriesId: string, point: DataPoint) => void;
  onSeriesToggle?: (seriesId: string, visible: boolean) => void;
}

const LineChart: React.FC<LineChartProps> = ({
  series,
  width = 600,
  height = 400,
  title,
  xAxisLabel,
  yAxisLabel,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  animate = true,
  className = '',
  onPointClick,
  onSeriesToggle
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ seriesId: string; point: DataPoint; x: number; y: number } | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(series.map(s => s.id)));
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Calculate chart dimensions
  const margin = { top: 40, right: 80, bottom: 60, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Get all data points for scaling
  const allPoints = series
    .filter(s => visibleSeries.has(s.id))
    .flatMap(s => s.data);

  // Calculate scales
  const xValues = allPoints.map(p => p.x);
  const yValues = allPoints.map(p => p.y);

  const xMin = Math.min(...xValues.map(v => typeof v === 'object' ? v.getTime() : Number(v)));
  const xMax = Math.max(...xValues.map(v => typeof v === 'object' ? v.getTime() : Number(v)));
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  // Add some padding to the scales
  const xPadding = (xMax - xMin) * 0.05;
  const yPadding = (yMax - yMin) * 0.1;

  const xScale = (value: number | string | Date) => {
    let numValue: number;
    if (typeof value === 'object' && value instanceof Date) {
      numValue = value.getTime();
    } else if (typeof value === 'string') {
      numValue = new Date(value).getTime();
    } else {
      numValue = Number(value);
    }
    return ((numValue - (xMin - xPadding)) / ((xMax - xMin) + 2 * xPadding)) * chartWidth;
  };

  const yScale = (value: number) => {
    return chartHeight - ((value - (yMin - yPadding)) / ((yMax - yMin) + 2 * yPadding)) * chartHeight;
  };

  // Draw the chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;

      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = margin.left + (i * chartWidth) / 10;
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, height - margin.bottom);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let i = 0; i <= 10; i++) {
        const y = margin.top + (i * chartHeight) / 10;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
      }
    }

    // Draw series
    series
      .filter(s => visibleSeries.has(s.id))
      .forEach(seriesData => {
        const { data, color, strokeWidth = 2, dashArray, showPoints = true, fill = false, fillOpacity = 0.1 } = seriesData;

        // Draw fill area
        if (fill && data.length > 1) {
          ctx.fillStyle = color;
          ctx.globalAlpha = fillOpacity;
          ctx.beginPath();
          ctx.moveTo(margin.left + xScale(data[0].x), height - margin.bottom);

          data.forEach(point => {
            ctx.lineTo(margin.left + xScale(point.x), margin.top + yScale(point.y));
          });

          ctx.lineTo(margin.left + xScale(data[data.length - 1].x), height - margin.bottom);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.setLineDash(dashArray ? dashArray.split(' ').map(Number) : []);

        ctx.beginPath();
        data.forEach((point, index) => {
          const x = margin.left + xScale(point.x);
          const y = margin.top + yScale(point.y);

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        // Draw points
        if (showPoints) {
          data.forEach(point => {
            const x = margin.left + xScale(point.x);
            const y = margin.top + yScale(point.y);

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();

            // White border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
          });
        }
      });

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // X-axis label
    if (xAxisLabel) {
      ctx.fillText(xAxisLabel, width / 2, height - 10);
    }

    // Y-axis label
    if (yAxisLabel) {
      ctx.save();
      ctx.translate(20, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yAxisLabel, 0, 0);
      ctx.restore();
    }

    // Draw title
    if (title) {
      ctx.font = '16px Arial';
      ctx.fillText(title, width / 2, 20);
    }

  }, [series, visibleSeries, width, height, showGrid, title, xAxisLabel, yAxisLabel]);

  // Handle mouse interactions
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setMousePosition({ x, y });

    if (!showTooltip) return;

    // Find closest point
    let closestPoint: { seriesId: string; point: DataPoint; distance: number; x: number; y: number } | null = null;

    series
      .filter(s => visibleSeries.has(s.id))
      .forEach(seriesData => {
        seriesData.data.forEach(point => {
          const pointX = margin.left + xScale(point.x);
          const pointY = margin.top + yScale(point.y);
          const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);

          if (distance < 20 && (!closestPoint || distance < closestPoint.distance)) {
            closestPoint = {
              seriesId: seriesData.id,
              point,
              distance,
              x: pointX,
              y: pointY
            };
          }
        });
      });

    setHoveredPoint(closestPoint);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setMousePosition(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hoveredPoint || !onPointClick) return;
    onPointClick(hoveredPoint.seriesId, hoveredPoint.point);
  };

  const toggleSeries = (seriesId: string) => {
    const newVisible = new Set(visibleSeries);
    if (newVisible.has(seriesId)) {
      newVisible.delete(seriesId);
    } else {
      newVisible.add(seriesId);
    }
    setVisibleSeries(newVisible);
    onSeriesToggle?.(seriesId, newVisible.has(seriesId));
  };

  return (
    <div className={`line-chart-container ${className}`}>
      {showLegend && (
        <div className="chart-legend">
          {series.map(seriesData => (
            <div
              key={seriesData.id}
              className={`legend-item ${visibleSeries.has(seriesData.id) ? 'visible' : 'hidden'}`}
              onClick={() => toggleSeries(seriesData.id)}
            >
              <div
                className="legend-color"
                style={{ backgroundColor: seriesData.color }}
              />
              <span className="legend-label">{seriesData.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="chart-canvas-container">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          style={{ cursor: hoveredPoint ? 'pointer' : 'default' }}
        />

        {showTooltip && hoveredPoint && (
          <div
            className="chart-tooltip"
            style={{
              left: hoveredPoint.x + 10,
              top: hoveredPoint.y - 10,
              transform: hoveredPoint.x > width / 2 ? 'translateX(-100%)' : 'none'
            }}
          >
            <div className="tooltip-title">
              {series.find(s => s.id === hoveredPoint.seriesId)?.name}
            </div>
            <div className="tooltip-content">
              <div>X: {hoveredPoint.point.x instanceof Date ? hoveredPoint.point.x.toLocaleDateString() : hoveredPoint.point.x}</div>
              <div>Y: {hoveredPoint.point.y}</div>
              {hoveredPoint.point.label && (
                <div>Label: {hoveredPoint.point.label}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineChart;