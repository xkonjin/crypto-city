'use client';

import React from 'react';

export interface BarChartData {
  /** Bar label */
  label: string;
  /** Bar value */
  value: number;
  /** Bar color */
  color: string;
}

export interface BarChartProps {
  /** Data items for the bar chart */
  data: BarChartData[];
  /** Chart height in pixels */
  height: number;
  /** Whether to show values on bars */
  showValues?: boolean;
  /** Whether bars are horizontal */
  horizontal?: boolean;
  /** Maximum value for scaling (auto if not provided) */
  maxValue?: number;
}

/**
 * Simple bar chart component
 * No external charting libraries - pure SVG
 */
export function BarChart({
  data,
  height,
  showValues = true,
  horizontal = false,
  maxValue: providedMaxValue,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div 
        data-testid="bar-chart"
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  const padding = { top: 10, right: 10, bottom: 30, left: horizontal ? 80 : 10 };
  const width = 400;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate max value
  const maxValue = providedMaxValue || Math.max(...data.map(d => d.value)) || 1;

  if (horizontal) {
    // Horizontal bar chart
    const barHeight = Math.min(30, (chartHeight / data.length) * 0.8);
    const barGap = (chartHeight - barHeight * data.length) / (data.length + 1);

    return (
      <svg
        data-testid="bar-chart"
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {data.map((item, index) => {
          const y = padding.top + barGap * (index + 1) + barHeight * index;
          const barWidth = (item.value / maxValue) * chartWidth;

          return (
            <g key={index}>
              {/* Label */}
              <text
                x={padding.left - 5}
                y={y + barHeight / 2}
                textAnchor="end"
                alignmentBaseline="middle"
                className="fill-foreground text-[10px]"
              >
                {truncateLabel(item.label, 10)}
              </text>

              {/* Bar */}
              <rect
                x={padding.left}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color}
                rx={3}
                ry={3}
              />

              {/* Value */}
              {showValues && (
                <text
                  x={padding.left + barWidth + 5}
                  y={y + barHeight / 2}
                  alignmentBaseline="middle"
                  className="fill-foreground text-[10px]"
                >
                  {formatValue(item.value)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // Vertical bar chart
  const barWidth = Math.min(40, (chartWidth / data.length) * 0.8);
  const barGap = (chartWidth - barWidth * data.length) / (data.length + 1);

  return (
    <svg
      data-testid="bar-chart"
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
        const y = padding.top + chartHeight * (1 - ratio);
        return (
          <line
            key={index}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeDasharray="2,2"
          />
        );
      })}

      {data.map((item, index) => {
        const x = padding.left + barGap * (index + 1) + barWidth * index;
        const barHeight = (item.value / maxValue) * chartHeight;
        const y = padding.top + chartHeight - barHeight;

        return (
          <g key={index}>
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={item.color}
              rx={3}
              ry={3}
            />

            {/* Value on top */}
            {showValues && (
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="fill-foreground text-[9px]"
              >
                {formatValue(item.value)}
              </text>
            )}

            {/* Label below */}
            <text
              x={x + barWidth / 2}
              y={height - 10}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
              transform={`rotate(-30, ${x + barWidth / 2}, ${height - 10})`}
            >
              {truncateLabel(item.label, 8)}
            </text>
          </g>
        );
      })}
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

/**
 * Truncate label to max length
 */
function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) return label;
  return label.slice(0, maxLength - 2) + '…';
}

export default BarChart;
