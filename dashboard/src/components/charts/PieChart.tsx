/**
 * Pie Chart Component
 *
 * Advanced pie chart for proportional data visualization
 * Supports donut charts, exploded slices, and interactive features
 */

import React, { useRef, useEffect, useState } from 'react';
import './Chart.css';

interface PieData {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

interface PieChartProps {
  data: PieData[];
  width?: number;
  height?: number;
  title?: string;
  type?: 'pie' | 'donut';
  showLabels?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  explodeSlices?: boolean;
  animate?: boolean;
  className?: string;
  onSliceClick?: (data: PieData) => void;
  onSliceHover?: (data: PieData | null) => void;
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 400,
  height = 400,
  title,
  type = 'pie',
  showLabels = true,
  showLegend = true,
  showTooltip = true,
  explodeSlices = false,
  animate = true,
  className = '',
  onSliceClick,
  onSliceHover
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSlice, setHoveredSlice] = useState<PieData | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<PieData | null>(null);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;
  const innerRadius = type === 'donut' ? radius * 0.6 : 0;

  // Calculate total value
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Calculate slice angles
  const slices = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 2 * Math.PI;
    return {
      ...item,
      percentage,
      angle,
      startAngle: data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 2 * Math.PI, 0),
      color: item.color || getDefaultColor(index)
    };
  });

  // Default color palette
  function getDefaultColor(index: number): string {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    return colors[index % colors.length];
  }

  // Draw the chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw slices
    slices.forEach((slice, index) => {
      const isHovered = hoveredSlice === slice;
      const isSelected = selectedSlice === slice;

      // Calculate slice position (exploded if needed)
      const explodeDistance = (isHovered || isSelected) && explodeSlices ? 20 : 0;
      const angle = slice.startAngle + slice.angle / 2;
      const sliceX = centerX + Math.cos(angle) * explodeDistance;
      const sliceY = centerY + Math.sin(angle) * explodeDistance;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(sliceX, sliceY);
      ctx.arc(sliceX, sliceY, radius, slice.startAngle, slice.startAngle + slice.angle);
      ctx.closePath();

      // Fill slice
      ctx.fillStyle = slice.color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw inner circle for donut
      if (type === 'donut') {
        ctx.beginPath();
        ctx.arc(sliceX, sliceY, innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw labels
      if (showLabels && slice.percentage > 0.05) { // Only show labels for slices > 5%
        const labelAngle = slice.startAngle + slice.angle / 2;
        const labelRadius = radius + 20;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;

        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw percentage
        const percentageText = `${(slice.percentage * 100).toFixed(1)}%`;
        ctx.fillText(percentageText, labelX, labelY);

        // Draw label
        const labelOffset = slice.angle < Math.PI ? 15 : -15;
        ctx.fillText(slice.label, labelX, labelY + labelOffset);
      }

      // Store slice bounds for interaction
      const path = new Path2D();
      path.moveTo(sliceX, sliceY);
      path.arc(sliceX, sliceY, radius, slice.startAngle, slice.startAngle + slice.angle);
      path.closePath();

      if (type === 'donut') {
        const innerPath = new Path2D();
        innerPath.arc(sliceX, sliceY, innerRadius, 0, 2 * Math.PI);
        // Note: Path2D doesn't support subtraction, so we'll handle donut interaction differently
      }

      (slice as any)._path = path;
      (slice as any)._centerX = sliceX;
      (slice as any)._centerY = sliceY;
    });

    // Draw center text for donut
    if (type === 'donut') {
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Total', centerX, centerY - 10);
      ctx.font = '24px Arial';
      ctx.fillText(total.toString(), centerX, centerY + 10);
    }

    // Draw title
    if (title) {
      ctx.fillStyle = '#333';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, centerX, 20);
    }

  }, [data, width, height, type, showLabels, title, hoveredSlice, selectedSlice, explodeSlices]);

  // Handle mouse interactions
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Find hovered slice
    let hovered: PieData | null = null;

    for (const slice of slices) {
      const path = (slice as any)._path;
      const sliceX = (slice as any)._centerX;
      const sliceY = (slice as any)._centerY;

      if (path) {
        // Check if point is in slice
        const dx = mouseX - sliceX;
        const dy = mouseY - sliceY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius && distance >= innerRadius) {
          // Check angle
          let angle = Math.atan2(dy, dx);
          if (angle < 0) angle += 2 * Math.PI;

          if (angle >= slice.startAngle && angle <= slice.startAngle + slice.angle) {
            hovered = slice;
            break;
          }
        }
      }
    }

    setHoveredSlice(hovered);
    onSliceHover?.(hovered);
  };

  const handleMouseLeave = () => {
    setHoveredSlice(null);
    onSliceHover?.(null);
  };

  const handleClick = () => {
    if (!hoveredSlice) return;

    setSelectedSlice(selectedSlice === hoveredSlice ? null : hoveredSlice);
    onSliceClick?.(hoveredSlice);
  };

  return (
    <div className={`pie-chart-container ${className}`}>
      {showLegend && (
        <div className="chart-legend">
          {slices.map((slice, index) => (
            <div
              key={slice.label}
              className={`legend-item ${hoveredSlice === slice ? 'hovered' : ''} ${selectedSlice === slice ? 'selected' : ''}`}
              onClick={() => {
                setSelectedSlice(selectedSlice === slice ? null : slice);
                onSliceClick?.(slice);
              }}
            >
              <div
                className="legend-color"
                style={{ backgroundColor: slice.color }}
              />
              <span className="legend-label">
                {slice.label}: {(slice.percentage * 100).toFixed(1)}%
              </span>
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
          style={{ cursor: hoveredSlice ? 'pointer' : 'default' }}
        />

        {showTooltip && hoveredSlice && (
          <div
            className="chart-tooltip"
            style={{
              left: (hoveredSlice as any)._centerX + 10,
              top: (hoveredSlice as any)._centerY - 10,
              transform: (hoveredSlice as any)._centerX > width / 2 ? 'translateX(-100%)' : 'none'
            }}
          >
            <div className="tooltip-title">{hoveredSlice.label}</div>
            <div className="tooltip-content">
              <div>Value: {hoveredSlice.value}</div>
              <div>Percentage: {((hoveredSlice.value / total) * 100).toFixed(1)}%</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PieChart;