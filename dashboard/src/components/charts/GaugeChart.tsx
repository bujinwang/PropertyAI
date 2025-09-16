/**
 * Gauge Chart Component
 *
 * Advanced gauge chart for KPI visualization and performance metrics
 * Supports multiple gauge types, thresholds, and customizable styling
 */

import React, { useRef, useEffect } from 'react';
import './Chart.css';

interface GaugeThreshold {
  value: number;
  color: string;
  label?: string;
}

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title?: string;
  unit?: string;
  thresholds?: GaugeThreshold[];
  type?: 'semi-circle' | 'full-circle' | 'linear';
  size?: number;
  showValue?: boolean;
  showLabels?: boolean;
  animate?: boolean;
  className?: string;
  color?: string;
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min = 0,
  max = 100,
  title,
  unit = '%',
  thresholds = [],
  type = 'semi-circle',
  size = 200,
  showValue = true,
  showLabels = true,
  animate = true,
  className = '',
  color
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate normalized value
  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = ((normalizedValue - min) / (max - min)) * 100;

  // Default thresholds if none provided
  const defaultThresholds: GaugeThreshold[] = [
    { value: 33, color: '#f44336', label: 'Low' },
    { value: 66, color: '#ff9800', label: 'Medium' },
    { value: 100, color: '#4caf50', label: 'High' }
  ];

  const gaugeThresholds = thresholds.length > 0 ? thresholds : defaultThresholds;

  // Get color based on value
  const getValueColor = (val: number): string => {
    if (color) return color;

    for (let i = gaugeThresholds.length - 1; i >= 0; i--) {
      if (val >= gaugeThresholds[i].value) {
        return gaugeThresholds[i].color;
      }
    }
    return gaugeThresholds[0].color;
  };

  // Draw the gauge
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 20;

    if (type === 'semi-circle') {
      // Draw background arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI, 0);
      ctx.lineWidth = 20;
      ctx.strokeStyle = '#e0e0e0';
      ctx.stroke();

      // Draw value arc
      const valueAngle = Math.PI + (percentage / 100) * Math.PI;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI, valueAngle);
      ctx.lineWidth = 20;
      ctx.strokeStyle = getValueColor(percentage);
      ctx.stroke();

      // Draw threshold markers
      gaugeThresholds.forEach(threshold => {
        const thresholdAngle = Math.PI + (threshold.value / 100) * Math.PI;
        const thresholdX = centerX + Math.cos(thresholdAngle) * (radius - 10);
        const thresholdY = centerY + Math.sin(thresholdAngle) * (radius - 10);

        ctx.beginPath();
        ctx.arc(thresholdX, thresholdY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = threshold.color;
        ctx.fill();
      });

      // Draw needle
      const needleAngle = Math.PI + (percentage / 100) * Math.PI;
      const needleLength = radius - 30;
      const needleX = centerX + Math.cos(needleAngle) * needleLength;
      const needleY = centerY + Math.sin(needleAngle) * needleLength;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(needleX, needleY);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#333';
      ctx.stroke();

      // Draw needle center
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#333';
      ctx.fill();

      // Draw value text
      if (showValue) {
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${value}${unit}`, centerX, centerY + radius / 2);
      }

      // Draw labels
      if (showLabels) {
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        // Min label
        ctx.fillText(min.toString(), centerX - radius + 10, centerY + 15);

        // Max label
        ctx.fillText(max.toString(), centerX + radius - 10, centerY + 15);
      }

    } else if (type === 'full-circle') {
      // Draw background circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.lineWidth = 20;
      ctx.strokeStyle = '#e0e0e0';
      ctx.stroke();

      // Draw value arc
      const valueAngle = (percentage / 100) * 2 * Math.PI - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, valueAngle);
      ctx.lineWidth = 20;
      ctx.strokeStyle = getValueColor(percentage);
      ctx.stroke();

      // Draw needle
      const needleAngle = (percentage / 100) * 2 * Math.PI - Math.PI / 2;
      const needleLength = radius - 30;
      const needleX = centerX + Math.cos(needleAngle) * needleLength;
      const needleY = centerY + Math.sin(needleAngle) * needleLength;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(needleX, needleY);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#333';
      ctx.stroke();

      // Draw needle center
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#333';
      ctx.fill();

      // Draw value text
      if (showValue) {
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${value}${unit}`, centerX, centerY);
      }

    } else if (type === 'linear') {
      const barWidth = size - 40;
      const barHeight = 30;
      const barX = 20;
      const barY = centerY - barHeight / 2;

      // Draw background bar
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Draw value bar
      const valueWidth = (percentage / 100) * barWidth;
      ctx.fillStyle = getValueColor(percentage);
      ctx.fillRect(barX, barY, valueWidth, barHeight);

      // Draw border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      // Draw threshold markers
      gaugeThresholds.forEach(threshold => {
        const thresholdX = barX + (threshold.value / 100) * barWidth;
        ctx.beginPath();
        ctx.moveTo(thresholdX, barY - 5);
        ctx.lineTo(thresholdX, barY + barHeight + 5);
        ctx.lineWidth = 2;
        ctx.strokeStyle = threshold.color;
        ctx.stroke();
      });

      // Draw value text
      if (showValue) {
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${value}${unit}`, centerX, barY - 15);
      }

      // Draw labels
      if (showLabels) {
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        // Min label
        ctx.fillText(min.toString(), barX, barY + barHeight + 20);

        // Max label
        ctx.fillText(max.toString(), barX + barWidth, barY + barHeight + 20);
      }
    }

    // Draw title
    if (title) {
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, centerX, 20);
    }

  }, [value, min, max, title, unit, thresholds, type, size, showValue, showLabels, gaugeThresholds, percentage]);

  return (
    <div className={`gauge-chart-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ display: 'block', margin: '0 auto' }}
      />

      {/* Threshold Legend */}
      {showLabels && gaugeThresholds.some(t => t.label) && (
        <div className="gauge-legend">
          {gaugeThresholds
            .filter(t => t.label)
            .map((threshold, index) => (
              <div key={index} className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: threshold.color }}
                />
                <span className="legend-label">
                  {threshold.label}: {threshold.value}{unit}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default GaugeChart;