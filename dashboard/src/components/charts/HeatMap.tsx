/**
 * Heat Map Component
 *
 * Advanced heat map for visualizing data density and correlations
 * Supports customizable color scales and interactive features
 */

import React, { useRef, useEffect, useState } from 'react';
import './Chart.css';

interface HeatMapData {
  x: number | string;
  y: number | string;
  value: number;
  metadata?: Record<string, any>;
}

interface HeatMapProps {
  data: HeatMapData[];
  width?: number;
  height?: number;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colorScale?: 'viridis' | 'plasma' | 'inferno' | 'magma' | 'coolwarm' | 'custom';
  customColors?: string[];
  showValues?: boolean;
  showLabels?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  className?: string;
  onCellClick?: (data: HeatMapData) => void;
  onCellHover?: (data: HeatMapData | null) => void;
}

const HeatMap: React.FC<HeatMapProps> = ({
  data,
  width = 600,
  height = 400,
  title,
  xAxisLabel,
  yAxisLabel,
  colorScale = 'viridis',
  customColors,
  showValues = false,
  showLabels = true,
  showTooltip = true,
  animate = true,
  className = '',
  onCellClick,
  onCellHover
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatMapData | null>(null);

  // Calculate chart dimensions
  const margin = { top: 40, right: 80, bottom: 60, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Get unique x and y values
  const xValues = Array.from(new Set(data.map(d => d.x))).sort();
  const yValues = Array.from(new Set(data.map(d => d.y))).sort();

  // Calculate cell dimensions
  const cellWidth = chartWidth / xValues.length;
  const cellHeight = chartHeight / yValues.length;

  // Get value range for color scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Color scale functions
  const getColor = (value: number): string => {
    if (customColors) {
      const normalizedValue = (value - minValue) / (maxValue - minValue);
      const colorIndex = Math.floor(normalizedValue * (customColors.length - 1));
      return customColors[colorIndex];
    }

    const normalizedValue = (value - minValue) / (maxValue - minValue);

    switch (colorScale) {
      case 'viridis':
        return viridisScale(normalizedValue);
      case 'plasma':
        return plasmaScale(normalizedValue);
      case 'inferno':
        return infernoScale(normalizedValue);
      case 'magma':
        return magmaScale(normalizedValue);
      case 'coolwarm':
        return coolwarmScale(normalizedValue);
      default:
        return viridisScale(normalizedValue);
    }
  };

  // Color scale implementations
  const viridisScale = (t: number): string => {
    // Viridis color scale approximation
    const r = Math.round(255 * (0.267004 + t * (0.127568 - 0.267004) + t * t * (0.329415 - 0.127568) + t * t * t * (0.993248 - 0.329415)));
    const g = Math.round(255 * (0.004874 + t * (0.566949 + t * (0.762373 - 0.566949) + t * t * (0.906157 - 0.762373))));
    const b = Math.round(255 * (0.329415 + t * (0.550556 + t * (0.227229 - 0.550556) + t * t * (0.143936 - 0.227229))));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const plasmaScale = (t: number): string => {
    const r = Math.round(255 * (0.050383 + t * (2.326209 + t * (-11.921497 + t * (22.351306 - t * 13.823918)))));
    const g = Math.round(255 * (0.027310 + t * (1.609664 + t * (-4.816607 + t * (7.051126 - t * 2.705815)))));
    const b = Math.round(255 * (0.017707 + t * (3.223994 + t * (-8.401597 + t * (10.568505 - t * 4.384233)))));
    return `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
  };

  const infernoScale = (t: number): string => {
    const r = Math.round(255 * (0.001462 + t * (0.56349 + t * (2.212255 - t * 2.629486))));
    const g = Math.round(255 * (0.000466 + t * (0.108915 + t * (1.784028 - t * 2.145366))));
    const b = Math.round(255 * (0.013866 + t * (1.957602 - t * 2.439669)));
    return `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
  };

  const magmaScale = (t: number): string => {
    const r = Math.round(255 * (-0.002136 + t * (2.048602 + t * (-6.660187 + t * 7.280534))));
    const g = Math.round(255 * (-0.000419 + t * (0.987083 + t * (-2.498612 + t * 2.16577))));
    const b = Math.round(255 * (-0.000013 + t * (1.173285 + t * (-2.105717 + t * 1.753702))));
    return `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
  };

  const coolwarmScale = (t: number): string => {
    if (t < 0.5) {
      const r = Math.round(255 * (0.227 + t * 2 * (0.753 - 0.227)));
      const g = Math.round(255 * (0.329 + t * 2 * (0.929 - 0.329)));
      const b = Math.round(255 * (0.925 + t * 2 * (0.973 - 0.925)));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = Math.round(255 * (0.753 + (t - 0.5) * 2 * (0.941 - 0.753)));
      const g = Math.round(255 * (0.929 + (t - 0.5) * 2 * (0.329 - 0.929)));
      const b = Math.round(255 * (0.973 + (t - 0.5) * 2 * (0.227 - 0.973)));
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  // Draw the heat map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw cells
    data.forEach(item => {
      const xIndex = xValues.indexOf(item.x);
      const yIndex = yValues.indexOf(item.y);

      if (xIndex === -1 || yIndex === -1) return;

      const x = margin.left + xIndex * cellWidth;
      const y = margin.top + yIndex * cellHeight;

      // Draw cell
      ctx.fillStyle = getColor(item.value);
      ctx.fillRect(x, y, cellWidth, cellHeight);

      // Draw border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      // Draw value text
      if (showValues) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          item.value.toFixed(1),
          x + cellWidth / 2,
          y + cellHeight / 2
        );
      }

      // Store cell bounds for interaction
      (item as any)._bounds = { x, y, width: cellWidth, height: cellHeight };
    });

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

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

    // X-axis labels
    if (showLabels) {
      xValues.forEach((value, index) => {
        const x = margin.left + index * cellWidth + cellWidth / 2;
        const y = height - margin.bottom + 15;

        ctx.fillText(value.toString(), x, y);
      });
    }

    // Y-axis labels
    if (showLabels) {
      ctx.textAlign = 'right';
      yValues.forEach((value, index) => {
        const x = margin.left - 10;
        const y = margin.top + index * cellHeight + cellHeight / 2 + 4;

        ctx.fillText(value.toString(), x, y);
      });
    }

    // Draw axis labels
    ctx.textAlign = 'center';

    if (xAxisLabel) {
      ctx.fillText(xAxisLabel, width / 2, height - 10);
    }

    if (yAxisLabel) {
      ctx.save();
      ctx.translate(20, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yAxisLabel, 0, 0);
      ctx.restore();
    }

    // Draw title
    if (title) {
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.fillText(title, width / 2, 20);
    }

  }, [data, width, height, showValues, showLabels, title, xAxisLabel, yAxisLabel, colorScale, customColors]);

  // Handle mouse interactions
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (!showTooltip) return;

    // Find hovered cell
    let hovered: HeatMapData | null = null;

    for (const item of data) {
      const bounds = (item as any)._bounds;
      if (bounds &&
          mouseX >= bounds.x &&
          mouseX <= bounds.x + bounds.width &&
          mouseY >= bounds.y &&
          mouseY <= bounds.y + bounds.height) {
        hovered = item;
        break;
      }
    }

    setHoveredCell(hovered);
    onCellHover?.(hovered);
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
    onCellHover?.(null);
  };

  const handleClick = () => {
    if (!hoveredCell) return;
    onCellClick?.(hoveredCell);
  };

  return (
    <div className={`heat-map-container ${className}`}>
      {/* Color Scale Legend */}
      <div className="heat-map-legend">
        <div className="color-scale">
          <div className="color-bar">
            {Array.from({ length: 100 }, (_, i) => (
              <div
                key={i}
                className="color-segment"
                style={{ backgroundColor: getColor(minValue + (i / 99) * (maxValue - minValue)) }}
              />
            ))}
          </div>
          <div className="scale-labels">
            <span>{minValue.toFixed(1)}</span>
            <span>{maxValue.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="chart-canvas-container">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          style={{ cursor: hoveredCell ? 'pointer' : 'default' }}
        />

        {showTooltip && hoveredCell && (
          <div
            className="chart-tooltip"
            style={{
              left: (hoveredCell as any)._bounds.x + (hoveredCell as any)._bounds.width / 2,
              top: (hoveredCell as any)._bounds.y - 10,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="tooltip-title">
              {hoveredCell.x} × {hoveredCell.y}
            </div>
            <div className="tooltip-content">
              <div>Value: {hoveredCell.value.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeatMap;