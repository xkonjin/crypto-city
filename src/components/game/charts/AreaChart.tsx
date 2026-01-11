'use client';

import React from 'react';

export interface AreaChartProps {
  /** Income data points */
  income: number[];
  /** Expense data points */
  expenses: number[];
  /** Labels for x-axis (optional) */
  labels?: string[];
  /** Chart height in pixels */
  height: number;
  /** Income color */
  incomeColor?: string;
  /** Expense color */
  expenseColor?: string;
  /** Whether to show legend */
  showLegend?: boolean;
}

/**
 * Area chart comparing income vs expenses
 * No external charting libraries - pure SVG
 */
export function AreaChart({
  income,
  expenses,
  labels,
  height,
  incomeColor = '#22c55e', // green
  expenseColor = '#ef4444', // red
  showLegend = true,
}: AreaChartProps) {
  const dataLength = Math.max(income.length, expenses.length);
  
  if (dataLength === 0) {
    return (
      <div 
        data-testid="area-chart"
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  const padding = { top: 10, right: 10, bottom: 20, left: 50 };
  const legendHeight = showLegend ? 25 : 0;
  const width = 400;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom - legendHeight;

  // Normalize arrays to same length
  const normalizedIncome = [...income];
  const normalizedExpenses = [...expenses];
  while (normalizedIncome.length < dataLength) normalizedIncome.push(0);
  while (normalizedExpenses.length < dataLength) normalizedExpenses.push(0);

  // Calculate min/max for scaling
  const allValues = [...normalizedIncome, ...normalizedExpenses];
  const minValue = Math.min(0, ...allValues); // Include 0 for baseline
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue || 1;

  // Add padding to the range
  const paddedMin = minValue - valueRange * 0.05;
  const paddedMax = maxValue + valueRange * 0.1;
  const paddedRange = paddedMax - paddedMin;

  // Convert data to SVG coordinates
  const getPoints = (data: number[]) => 
    data.map((value, index) => ({
      x: padding.left + (index / (dataLength - 1 || 1)) * chartWidth,
      y: padding.top + chartHeight - ((value - paddedMin) / paddedRange) * chartHeight,
      value,
    }));

  const incomePoints = getPoints(normalizedIncome);
  const expensePoints = getPoints(normalizedExpenses);

  // Create paths
  const createLinePath = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  const createAreaPath = (points: { x: number; y: number }[]) => {
    const baseline = padding.top + chartHeight;
    const linePath = createLinePath(points);
    return `${linePath} L ${points[points.length - 1].x},${baseline} L ${padding.left},${baseline} Z`;
  };

  // Grid lines (5 horizontal lines)
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (i / 4) * chartHeight;
    const value = paddedMax - (i / 4) * paddedRange;
    gridLines.push({ y, value });
  }

  return (
    <div data-testid="area-chart" data-testid-alt="income-expense-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {gridLines.map((line, index) => (
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

        {/* Income area (behind) */}
        <path
          d={createAreaPath(incomePoints)}
          fill={incomeColor}
          fillOpacity={0.3}
        />

        {/* Expense area (in front) */}
        <path
          d={createAreaPath(expensePoints)}
          fill={expenseColor}
          fillOpacity={0.3}
        />

        {/* Income line */}
        <path
          d={createLinePath(incomePoints)}
          fill="none"
          stroke={incomeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Expense line */}
        <path
          d={createLinePath(expensePoints)}
          fill="none"
          stroke={expenseColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X-axis labels */}
        {labels && labels.length > 0 && (
          <>
            {[0, Math.floor(labels.length / 2), labels.length - 1]
              .filter((i, idx, arr) => arr.indexOf(i) === idx)
              .map(index => {
                if (index >= labels.length) return null;
                const x = padding.left + (index / (dataLength - 1 || 1)) * chartWidth;
                return (
                  <text
                    key={index}
                    x={x}
                    y={height - legendHeight - 5}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[8px]"
                  >
                    {labels[index]}
                  </text>
                );
              })}
          </>
        )}

        {/* Legend */}
        {showLegend && (
          <g transform={`translate(${padding.left}, ${height - 15})`}>
            <rect x={0} y={0} width={12} height={12} fill={incomeColor} fillOpacity={0.5} />
            <text x={16} y={10} className="fill-foreground text-[10px]">Income</text>
            
            <rect x={80} y={0} width={12} height={12} fill={expenseColor} fillOpacity={0.5} />
            <text x={96} y={10} className="fill-foreground text-[10px]">Expenses</text>
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * Format large values for display
 */
function formatValue(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export default AreaChart;
