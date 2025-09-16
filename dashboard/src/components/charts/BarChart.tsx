/**
 * Bar Chart Component
 *
 * Advanced bar chart for categorical data comparison
 * Supports horizontal/vertical bars, stacked bars, and grouped bars
 */

import React, { useRef, useEffect, useState } from 'react';
import './Chart.css';

interface BarData {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

interface Series {
  id: string;
  name: string;
  data: BarData[];
  color: string;
}

interface BarChartProps {
  series: Series[];
  width?: number;
  height?: number;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  orientation?: 'vertical' | 'horizontal';
  type?: 'single' | 'grouped' | 'stacked';
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  className?: string;
  onBarClick?: (seriesId: string, data: BarData) => void;
  onSeriesToggle?: (seriesId: string, visible: boolean) => void;
}

const BarChart: React.FC<BarChartProps> = ({
  series,
  width = 600,
  height = 400,
  title,
  xAxisLabel,
  yAxisLabel,
  orientation = 'vertical',
  type = 'single',
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  animate = true,
  className = '',
  onBarClick,
  onSeriesToggle
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredBar, setHoveredBar] = useState<{ seriesId: string; data: BarData; x: number; y: number; width: number; height: number } | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(series.map(s => s.id)));

  // Calculate chart dimensions
  const margin = { top: 40, right: 80, bottom: 60, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Get all data for scaling
  const allData = series
    .filter(s => visibleSeries.has(s.id))
    .flatMap(s => s.data);

  const maxValue = Math.max(...allData.map(d => d.value));
  const minValue = Math.min(0, ...allData.map(d => d.value)); // Include 0 for better visualization

  // Calculate scales
  const valueScale = (value: number) => {
    if (orientation === 'vertical') {
      return ((value - minValue) / (maxValue - minValue)) * chartHeight;
    } else {
      return ((value - minValue) / (maxValue - minValue)) * chartWidth;
    }
  };

  // Get unique labels for positioning
  const labels = Array.from(new Set(allData.map(d => d.label)));
  const barWidth = orientation === 'vertical'
    ? chartWidth / labels.length
    : chartHeight / labels.length;

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

      if (orientation === 'vertical') {
        // Horizontal grid lines
        for (let i = 0; i <= 10; i++) {
          const y = margin.top + (i * chartHeight) / 10;
          ctx.beginPath();
          ctx.moveTo(margin.left, y);
          ctx.lineTo(width - margin.right, y);
          ctx.stroke();
        }
      } else {
        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
          const x = margin.left + (i * chartWidth) / 10;
          ctx.beginPath();
          ctx.moveTo(x, margin.top);
          ctx.lineTo(x, height - margin.bottom);
          ctx.stroke();
        }
      }
    }

    // Draw bars
    series
      .filter(s => visibleSeries.has(s.id))
      .forEach((seriesData, seriesIndex) => {
        const { data, color } = seriesData;

        data.forEach((item, itemIndex) => {
          const labelIndex = labels.indexOf(item.label);
          const barColor = item.color || color;

          let x, y, barW, barH;

          if (orientation === 'vertical') {
            if (type === 'grouped') {
              const groupWidth = barWidth / series.filter(s => visibleSeries.has(s.id)).length;
              x = margin.left + labelIndex * barWidth + seriesIndex * groupWidth;
              barW = groupWidth * 0.8;
            } else {
              x = margin.left + labelIndex * barWidth + barWidth * 0.1;
              barW = barWidth * 0.8;
            }

            const valueHeight = valueScale(item.value);
            const zeroHeight = valueScale(0);
            y = margin.top + chartHeight - Math.max(valueHeight, zeroHeight);
            barH = Math.abs(valueHeight - zeroHeight);
          } else {
            if (type === 'grouped') {
              const groupHeight = barWidth / series.filter(s => visibleSeries.has(s.id)).length;
              y = margin.top + labelIndex * barWidth + seriesIndex * groupHeight;
              barH = groupHeight * 0.8;
            } else {
              y = margin.top + labelIndex * barWidth + barWidth * 0.1;
              barH = barWidth * 0.8;
            }

            const valueWidth = valueScale(item.value);
            const zeroWidth = valueScale(0);
            x = margin.left + Math.min(valueWidth, zeroWidth);
            barW = Math.abs(valueWidth - zeroWidth);
          }

          // Draw bar
          ctx.fillStyle = barColor;
          ctx.fillRect(x, y, barW, barH);

          // Draw border
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, barW, barH);

          // Store bar position for interaction
          (item as any)._bounds = { x, y, width: barW, height: barH, seriesId: seriesData.id };
        });
      });

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    if (orientation === 'vertical') {
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
    } else {
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
    }

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

    // Draw value labels on bars
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    series
      .filter(s => visibleSeries.has(s.id))
      .forEach(seriesData => {
        seriesData.data.forEach(item => {
          const bounds = (item as any)._bounds;
          if (bounds) {
            const labelX = bounds.x + bounds.width / 2;
            const labelY = orientation === 'vertical'
              ? bounds.y - 5
              : bounds.y + bounds.height / 2 + 3;

            ctx.fillText(item.value.toString(), labelX, labelY);
          }
        });
      });

  }, [series, visibleSeries, width, height, orientation, type, showGrid, title, xAxisLabel, yAxisLabel]);

  // Handle mouse interactions
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (!showTooltip) return;

    // Find hovered bar
    let hovered: typeof hoveredBar = null;

    series
      .filter(s => visibleSeries.has(s.id))
      .forEach(seriesData => {
        seriesData.data.forEach(item => {
          const bounds = (item as any)._bounds;
          if (bounds &&
              mouseX >= bounds.x &&
              mouseX <= bounds.x + bounds.width &&
              mouseY >= bounds.y &&
              mouseY <= bounds.y + bounds.height) {
            hovered = {
              seriesId: seriesData.id,
              data: item,
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height
            };
          }
        });
      });

    setHoveredBar(hovered);
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  const handleClick = () => {
    if (!hoveredBar || !onBarClick) return;
    onBarClick(hoveredBar.seriesId, hoveredBar.data);
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
    <div className={`bar-chart-container ${className}`}>
      {showLegend && series.length > 1 && (
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
          style={{ cursor: hoveredBar ? 'pointer' : 'default' }}
        />

        {showTooltip && hoveredBar && (
          <div
            className="chart-tooltip"
            style={{
              left: hoveredBar.x + hoveredBar.width / 2,
              top: hoveredBar.y - 10,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="tooltip-title">
              {series.find(s => s.id === hoveredBar.seriesId)?.name}
            </div>
            <div className="tooltip-content">
              <div>Label: {hoveredBar.data.label}</div>
              <div>Value: {hoveredBar.data.value}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarChart;