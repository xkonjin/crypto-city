'use client';

import React from 'react';

export interface LineChartProps {
  /** Data points to plot */
  data: number[];
  /** Labels for x-axis (optional) */
  labels?: string[];
  /** Line color */
  color: string;
  /** Chart height in pixels */
  height: number;
  /** Whether to show grid lines */
  showGrid?: boolean;
  /** Whether to show dots on data points */
  showDots?: boolean;
  /** Fill area under the line */
  fillArea?: boolean;
  /** Gradient fill color (for fillArea) */
  fillColor?: string;
}

/**
 * Simple SVG line chart component
 * No external charting libraries - pure SVG
 */
export function LineChart({
  data,
  labels,
  color,
  height,
  showGrid = true,
  showDots = false,
  fillArea = false,
  fillColor,
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div 
        data-testid="line-chart"
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  const padding = { top: 10, right: 10, bottom: 20, left: 50 };
  const width = 400; // Will be responsive
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate min/max for scaling
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const valueRange = maxValue - minValue || 1; // Avoid division by zero

  // Add some padding to the range
  const paddedMin = minValue - valueRange * 0.1;
  const paddedMax = maxValue + valueRange * 0.1;
  const paddedRange = paddedMax - paddedMin;

  // Convert data points to SVG coordinates
  const points = data.map((value, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((value - paddedMin) / paddedRange) * chartHeight;
    return { x, y, value };
  });

  // Create line path
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
    .join(' ');

  // Create area path (for fill)
  const areaPath = fillArea
    ? `${linePath} L ${points[points.length - 1].x},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`
    : '';

  // Grid lines (5 horizontal lines)
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (i / 4) * chartHeight;
    const value = paddedMax - (i / 4) * paddedRange;
    gridLines.push({ y, value });
  }

  return (
    <svg
      data-testid="line-chart"
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {showGrid && gridLines.map((line, index) => (
        <g key={index}>
          <line
            x1={padding.left}
            y1={line.y}
            x2={width - padding.right}
            y2={line.y}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeDasharray="2,2"
          />
          <text
            x={padding.left - 5}
            y={line.y}
            textAnchor="end"
            alignmentBaseline="middle"
            className="fill-muted-foreground text-[8px]"
          >
            {formatValue(line.value)}
          </text>
        </g>
      ))}

      {/* Fill area */}
      {fillArea && (
        <path
          d={areaPath}
          fill={fillColor || color}
          fillOpacity={0.2}
        />
      )}

      {/* Line path */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data point dots */}
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={3}
          fill={color}
        />
      ))}

      {/* X-axis labels */}
      {labels && labels.length > 0 && (
        <>
          {/* Show first, middle, and last label */}
          {[0, Math.floor(labels.length / 2), labels.length - 1]
            .filter((i, idx, arr) => arr.indexOf(i) === idx) // Remove duplicates for small arrays
            .map(index => {
              if (index >= labels.length) return null;
              const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
              return (
                <text
                  key={index}
                  x={x}
                  y={height - 5}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px]"
                >
                  {labels[index]}
                </text>
              );
            })}
        </>
      )}
    </svg>
  );
}

/**
 * Format large values for display
 */
function formatValue(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

export default LineChart;
