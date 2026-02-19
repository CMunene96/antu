// src/components/analytics/StatCard.jsx
// Displays a single KPI/metric with trend indicator and icon

import { useMemo } from "react";

/**
 * StatCard Component
 *
 * Shows a key metric with:
 * - Large value display
 * - Trend indicator (up/down/neutral)
 * - Percentage change
 * - Icon
 * - Subtitle/description
 * - Loading state
 * - Multiple color themes
 *
 * Props:
 * - title:       string — card title (e.g., "Total Revenue")
 * - value:       string | number — main metric value
 * - subtitle:    string — additional info (optional)
 * - trend:       "up" | "down" | "neutral" — trend direction
 * - trendValue:  number — percentage change (e.g., 12.5 for +12.5%)
 * - icon:        JSX element — icon to display
 * - color:       "blue" | "emerald" | "amber" | "red" | "purple" — theme color
 * - loading:     bool — show loading skeleton
 * - onClick:     function — called when card is clicked (optional)
 *
 * Usage:
 * <StatCard
 *   title="Total Revenue"
 *   value="KSH 125,000"
 *   subtitle="This month"
 *   trend="up"
 *   trendValue={12.5}
 *   icon={<DollarIcon />}
 *   color="emerald"
 * />
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function TrendUpIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );
}

function TrendNeutralIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

// ─── Color Theme Config ───────────────────────────────────────────────────────

const COLOR_THEMES = {
  blue: {
    bg: "bg-blue-50",
    iconBg: "bg-blue-600",
    iconText: "text-white",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  emerald: {
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-600",
    iconText: "text-white",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  amber: {
    bg: "bg-amber-50",
    iconBg: "bg-amber-600",
    iconText: "text-white",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  red: {
    bg: "bg-red-50",
    iconBg: "bg-red-600",
    iconText: "text-white",
    text: "text-red-600",
    border: "border-red-200",
  },
  purple: {
    bg: "bg-purple-50",
    iconBg: "bg-purple-600",
    iconText: "text-white",
    text: "text-purple-600",
    border: "border-purple-200",
  },
  gray: {
    bg: "bg-gray-50",
    iconBg: "bg-gray-600",
    iconText: "text-white",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

// ─── Trend Config ─────────────────────────────────────────────────────────────

const TREND_CONFIG = {
  up: {
    icon: <TrendUpIcon />,
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "increase",
  },
  down: {
    icon: <TrendDownIcon />,
    text: "text-red-600",
    bg: "bg-red-50",
    label: "decrease",
  },
  neutral: {
    icon: <TrendNeutralIcon />,
    text: "text-gray-600",
    bg: "bg-gray-50",
    label: "no change",
  },
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function StatCardSkeleton({ color = "blue" }) {
  const theme = COLOR_THEMES[color];

  return (
    <div className={`bg-white rounded-xl border ${theme.border} p-6 shadow-sm animate-pulse`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
          <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
        <div className={`w-12 h-12 rounded-lg ${theme.iconBg} opacity-20`} />
      </div>
    </div>
  );
}

// ─── Main StatCard Component ──────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = "blue",
  loading = false,
  onClick,
}) {
  const theme = COLOR_THEMES[color] || COLOR_THEMES.blue;
  const trendConfig = trend ? TREND_CONFIG[trend] : null;

  // Format trend value
  const formattedTrend = useMemo(() => {
    if (!trendValue || trendValue === 0) return null;
    const prefix = trendValue > 0 ? "+" : "";
    return `${prefix}${trendValue.toFixed(1)}%`;
  }, [trendValue]);

  // Loading state
  if (loading) {
    return <StatCardSkeleton color={color} />;
  }

  return (
    <div
      className={`
        bg-white rounded-xl border ${theme.border}
        p-6 shadow-sm
        hover:shadow-md transition-all duration-300
        ${onClick ? "cursor-pointer hover:border-opacity-70" : ""}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        
        {/* Left Side - Data */}
        <div className="flex-1 min-w-0">
          
          {/* Title */}
          <p className="text-sm font-medium text-gray-600 mb-1 truncate">
            {title}
          </p>

          {/* Main Value */}
          <p className="text-3xl font-bold text-gray-900 mb-2 truncate">
            {value}
          </p>

          {/* Trend & Subtitle */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Trend Indicator */}
            {trendConfig && formattedTrend && (
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                  text-xs font-semibold
                  ${trendConfig.text} ${trendConfig.bg}
                `}
              >
                {trendConfig.icon}
                {formattedTrend}
              </span>
            )}

            {/* Subtitle */}
            {subtitle && (
              <span className="text-xs text-gray-500">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right Side - Icon */}
        {icon && (
          <div
            className={`
              w-12 h-12 rounded-lg flex items-center justify-center
              ${theme.iconBg} ${theme.iconText}
              shadow-sm flex-shrink-0
            `}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;