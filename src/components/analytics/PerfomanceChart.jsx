// src/components/analytics/PerformanceChart.jsx
// Horizontal bar chart for comparing performance metrics (drivers, vehicles, etc.)

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/**
 * PerformanceChart Component
 *
 * Displays performance comparison with horizontal bars:
 * - Driver performance (deliveries, completion rate)
 * - Vehicle utilization
 * - Top customers
 * - Any ranking/comparison data
 *
 * Props:
 * - data:          array — performance data
 * - title:         string — chart title
 * - subtitle:      string — chart subtitle (optional)
 * - height:        number — chart height (default: 400)
 * - metric:        string — metric name for display
 * - showTopN:      number — show only top N items (default: all)
 * - colorScheme:   "gradient" | "solid" | "performance" — color style
 * - loading:       bool — show loading state
 * - emptyMessage:  string — message when no data
 *
 * Data Format:
 * [
 *   { name: "James Kamau", value: 42, label: "42 deliveries" },
 *   { name: "Mary Njeri", value: 38, label: "38 deliveries" },
 *   ...
 * ]
 *
 * Usage:
 * <PerformanceChart
 *   data={driverPerformance}
 *   title="Top Performing Drivers"
 *   subtitle="By completed deliveries"
 *   metric="Deliveries"
 *   showTopN={10}
 *   colorScheme="gradient"
 * />
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function TrophyIcon() {
  return (
    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
    </svg>
  );
}

function MedalIcon({ rank }) {
  const colors = {
    1: "text-amber-400", // Gold
    2: "text-gray-400",  // Silver
    3: "text-amber-600", // Bronze
  };

  return (
    <div className={`flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 ${colors[rank] || "text-gray-300"} border-current`}>
      <span className="text-xs font-bold">{rank}</span>
    </div>
  );
}

// ─── Color Schemes ────────────────────────────────────────────────────────────

const COLOR_SCHEMES = {
  // Gradient from blue to purple
  gradient: (index, total) => {
    const hue = 220 - (index / total) * 60; // 220 (blue) to 160 (purple)
    return `hsl(${hue}, 70%, 55%)`;
  },

  // Solid blue
  solid: () => "#2563eb",

  // Performance-based (green to red)
  performance: (value, max) => {
    const percent = (value / max) * 100;
    if (percent >= 80) return "#10b981"; // Green
    if (percent >= 60) return "#3b82f6"; // Blue
    if (percent >= 40) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  },
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-600">Value:</span>
          <span className="text-sm font-bold text-gray-900">
            {data.label || data.value}
          </span>
        </div>
        {data.percentage && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-600">Percentage:</span>
            <span className="text-sm font-bold text-gray-900">
              {data.percentage.toFixed(1)}%
            </span>
          </div>
        )}
        {data.additional && (
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
            {data.additional}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ChartSkeleton({ height }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="h-5 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
      <div className="h-3 w-32 bg-gray-200 rounded mb-6 animate-pulse" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            <div
              className="h-8 bg-gray-100 rounded animate-pulse"
              style={{ width: `${30 + Math.random() * 60}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main PerformanceChart Component ──────────────────────────────────────────

function PerformanceChart({
  data = [],
  title = "Performance Chart",
  subtitle,
  height = 400,
  metric = "Value",
  showTopN,
  colorScheme = "gradient",
  loading = false,
  emptyMessage = "No performance data available",
}) {
  // Process data - limit to top N if specified
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let sorted = [...data].sort((a, b) => b.value - a.value);
    
    if (showTopN && showTopN > 0) {
      sorted = sorted.slice(0, showTopN);
    }

    // Add percentage relative to max
    const maxValue = Math.max(...sorted.map((d) => d.value));
    return sorted.map((item, index) => ({
      ...item,
      percentage: (item.value / maxValue) * 100,
      rank: index + 1,
    }));
  }, [data, showTopN]);

  // Get color for bar
  const getBarColor = (item, index) => {
    const scheme = COLOR_SCHEMES[colorScheme];
    
    if (colorScheme === "gradient") {
      return scheme(index, processedData.length);
    } else if (colorScheme === "performance") {
      const maxValue = Math.max(...processedData.map((d) => d.value));
      return scheme(item.value, maxValue);
    } else {
      return scheme();
    }
  };

  // Calculate average
  const average = useMemo(() => {
    if (processedData.length === 0) return 0;
    const sum = processedData.reduce((acc, item) => acc + item.value, 0);
    return sum / processedData.length;
  }, [processedData]);

  // Loading state
  if (loading) {
    return <ChartSkeleton height={height} />;
  }

  // No data state
  if (!processedData || processedData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mb-6">{subtitle}</p>}
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {title}
              {processedData.length > 0 && <TrophyIcon />}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          
          {/* Stats */}
          <div className="text-right">
            <p className="text-xs text-gray-500">Average</p>
            <p className="text-lg font-bold text-gray-900">
              {average.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Podium (if 3+ items) */}
      {processedData.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {processedData.slice(0, 3).map((item, index) => (
            <div
              key={item.name}
              className={`
                text-center p-3 rounded-lg border-2
                ${index === 0 ? "bg-amber-50 border-amber-200" : ""}
                ${index === 1 ? "bg-gray-50 border-gray-200" : ""}
                ${index === 2 ? "bg-orange-50 border-orange-200" : ""}
              `}
            >
              <div className="flex justify-center mb-2">
                <MedalIcon rank={index + 1} />
              </div>
              <p className="text-xs font-medium text-gray-900 truncate">
                {item.name}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {item.label || item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={processedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis
            type="number"
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
          <Bar
            dataKey="value"
            radius={[0, 8, 8, 0]}
            label={{
              position: "right",
              formatter: (value) => value,
              style: { fontSize: "11px", fill: "#4b5563", fontWeight: 600 },
            }}
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Showing {processedData.length} {processedData.length === 1 ? "item" : "items"}
          {showTopN && data.length > showTopN && ` (top ${showTopN} of ${data.length})`}
        </p>
      </div>
    </div>
  );
}

export default PerformanceChart;