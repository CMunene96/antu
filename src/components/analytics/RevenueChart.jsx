// src/components/analytics/RevenueChart.jsx
// Beautiful revenue chart with multiple visualization options using Recharts

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/**
 * RevenueChart Component
 *
 * Displays revenue data in multiple chart types with:
 * - Line chart (default)
 * - Area chart
 * - Bar chart
 * - Multiple data series support
 * - Custom tooltips
 * - Responsive sizing
 * - Period selector
 * - Export button
 *
 * Props:
 * - data:         array — chart data points
 * - title:        string — chart title
 * - height:       number — chart height in pixels (default: 350)
 * - showControls: bool — show chart type switcher (default: true)
 * - chartType:    "line" | "area" | "bar" — initial chart type
 * - dataKeys:     array — keys to plot (default: ["revenue"])
 * - colors:       array — colors for each data key (default: ["#2563eb"])
 * - period:       string — time period label (optional)
 * - loading:      bool — show loading state
 *
 * Data Format:
 * [
 *   { month: "Jan", revenue: 15000, cost: 8000 },
 *   { month: "Feb", revenue: 18000, cost: 9500 },
 *   ...
 * ]
 *
 * Usage:
 * <RevenueChart
 *   data={monthlyRevenue}
 *   title="Revenue Over Time"
 *   dataKeys={["revenue", "cost"]}
 *   colors={["#2563eb", "#ef4444"]}
 *   showControls={true}
 * />
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function LineChartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  );
}

function AreaChartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, dataKeys }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-600 capitalize">
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-900">
              {typeof entry.value === 'number'
                ? `KSH ${entry.value.toLocaleString("en-KE")}`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ChartSkeleton({ height }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="h-4 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-12 bg-gray-100 rounded animate-pulse"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main RevenueChart Component ──────────────────────────────────────────────

function RevenueChart({
  data = [],
  title = "Revenue Chart",
  height = 350,
  showControls = true,
  chartType: initialChartType = "line",
  dataKeys = ["revenue"],
  colors = ["#2563eb"],
  period,
  loading = false,
}) {
  const [chartType, setChartType] = useState(initialChartType);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totals = {};
    dataKeys.forEach((key) => {
      totals[key] = data.reduce((sum, item) => sum + (item[key] || 0), 0);
    });

    return totals;
  }, [data, dataKeys]);

  // Export data as CSV
  const exportData = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `revenue-chart-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading) {
    return <ChartSkeleton height={height} />;
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No data available for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {period && (
            <p className="text-sm text-gray-500 mt-0.5">{period}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          
          {/* Chart Type Switcher */}
          {showControls && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartType("line")}
                className={`
                  p-1.5 rounded transition-colors
                  ${chartType === "line" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}
                `}
                title="Line Chart"
              >
                <LineChartIcon />
              </button>
              <button
                onClick={() => setChartType("area")}
                className={`
                  p-1.5 rounded transition-colors
                  ${chartType === "area" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}
                `}
                title="Area Chart"
              >
                <AreaChartIcon />
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`
                  p-1.5 rounded transition-colors
                  ${chartType === "bar" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}
                `}
                title="Bar Chart"
              >
                <BarChartIcon />
              </button>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={exportData}
            className="
              px-3 py-1.5 text-sm font-medium text-gray-700
              border border-gray-300 rounded-lg
              hover:bg-gray-50 transition-colors
              flex items-center gap-1.5
            "
          >
            <DownloadIcon />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {dataKeys.map((key, index) => (
            <div key={key} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors[index] }}
                />
                <p className="text-xs text-gray-600 capitalize">{key}</p>
              </div>
              <p className="text-xl font-bold text-gray-900">
                KSH {stats[key]?.toLocaleString("en-KE") || 0}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        
        {/* Line Chart */}
        {chartType === "line" && (
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={Object.keys(data[0])[0]}
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip dataKeys={dataKeys} />} />
            {dataKeys.length > 1 && <Legend />}
            
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index]}
                strokeWidth={3}
                dot={{ fill: colors[index], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )}

        {/* Area Chart */}
        {chartType === "area" && (
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              {dataKeys.map((key, index) => (
                <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[index]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[index]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={Object.keys(data[0])[0]}
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip dataKeys={dataKeys} />} />
            {dataKeys.length > 1 && <Legend />}
            
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index]}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color${key})`}
              />
            ))}
          </AreaChart>
        )}

        {/* Bar Chart */}
        {chartType === "bar" && (
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={Object.keys(data[0])[0]}
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip dataKeys={dataKeys} />} />
            {dataKeys.length > 1 && <Legend />}
            
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index]}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueChart;