// src/components/drivers/DriverCard.jsx
// Displays driver information with status, stats, and actions

import { useState } from "react";

/**
 * DriverCard Component
 *
 * Shows driver details in a card format with real-time status, performance stats, and quick actions.
 *
 * Props:
 * - driver:         object — driver data from API
 * - onViewDetails:  function — called when "View Details" clicked
 * - onAssignVehicle: function — called when "Assign Vehicle" clicked (admin only)
 * - onUpdateStatus: function — called when status is changed
 * - showActions:    bool — show/hide action buttons (default: true)
 * - compact:        bool — smaller version for lists (default: false)
 * - isAdmin:        bool — show admin controls (default: false)
 *
 * Usage:
 * <DriverCard
 *   driver={driverData}
 *   onViewDetails={() => navigate(`/drivers/${driver.id}`)}
 *   showActions={true}
 *   isAdmin={true}
 * />
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm8 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 8l1.5-4h13l1.5 4M3 8h18M3 8v6m18-6v6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function StarIcon({ filled = false }) {
  return (
    <svg
      className={`w-4 h-4 ${filled ? "fill-amber-400 text-amber-400" : "fill-none text-gray-300"}`}
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─── Status Badge Config ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  available: {
    label: "Available",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    pulse: true,
  },
  on_duty: {
    label: "On Duty",
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    pulse: true,
  },
  off_duty: {
    label: "Off Duty",
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatLastUpdate(timestamp) {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
}

function getPerformanceRating(completionRate) {
  if (completionRate >= 95) return 5;
  if (completionRate >= 85) return 4;
  if (completionRate >= 70) return 3;
  if (completionRate >= 50) return 2;
  return 1;
}

// ─── Status Badge Sub-Component ───────────────────────────────────────────────

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.off_duty;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-xs font-semibold tracking-wide
        ${config.bg} ${config.text}
      `}
    >
      <span
        className={`
          w-1.5 h-1.5 rounded-full ${config.dot}
          ${config.pulse ? "animate-pulse" : ""}
        `}
      />
      {config.label}
    </span>
  );
}

// ─── Star Rating Sub-Component ────────────────────────────────────────────────

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= rating} />
      ))}
    </div>
  );
}

// ─── Main DriverCard Component ────────────────────────────────────────────────

function DriverCard({
  driver,
  onViewDetails,
  onAssignVehicle,
  onUpdateStatus,
  showActions = true,
  compact = false,
  isAdmin = false,
}) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const {
    id,
    user,
    status,
    vehicle,
    license_number,
    current_latitude,
    current_longitude,
    last_location_update,
    is_active,
    // Stats (if provided)
    total_deliveries = 0,
    completed_deliveries = 0,
    total_distance_km = 0,
  } = driver;

  // Calculate completion rate
  const completionRate =
    total_deliveries > 0 ? (completed_deliveries / total_deliveries) * 100 : 0;
  
  const performanceRating = getPerformanceRating(completionRate);

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (onUpdateStatus && !isUpdatingStatus) {
      setIsUpdatingStatus(true);
      try {
        await onUpdateStatus(driver, newStatus);
      } finally {
        setIsUpdatingStatus(false);
      }
    }
  };

  if (compact) {
    // ─── COMPACT VERSION (for lists) ────────────────────────────────────
    return (
      <div
        className="
          bg-white rounded-lg border border-gray-200
          p-4 hover:shadow-md transition-all duration-200
          cursor-pointer
        "
        onClick={onViewDetails}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "DR"}
            </div>
            
            <div>
              <p className="font-semibold text-sm text-gray-900">{user?.full_name || "Unknown Driver"}</p>
              <p className="text-xs text-gray-500">{license_number || "No license"}</p>
            </div>
          </div>
          
          <StatusBadge status={status} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500">Deliveries</p>
            <p className="font-bold text-sm text-gray-900">{completed_deliveries}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Rate</p>
            <p className="font-bold text-sm text-gray-900">{completionRate.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Distance</p>
            <p className="font-bold text-sm text-gray-900">{total_distance_km.toFixed(0)}km</p>
          </div>
        </div>

        {/* Vehicle info */}
        {vehicle && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-600">
            <TruckIcon />
            <span className="truncate">{vehicle.registration_number} ({vehicle.vehicle_type})</span>
          </div>
        )}
      </div>
    );
  }

  // ─── FULL VERSION ────────────────────────────────────────────────────────────
  return (
    <div
      className="
        bg-white rounded-xl border border-gray-200
        overflow-hidden hover:shadow-xl transition-all duration-300
        hover:border-blue-300
      "
    >
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
              {user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "DR"}
            </div>
            
            <div>
              <p className="font-bold text-gray-900 text-base">{user?.full_name || "Unknown Driver"}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                License: {license_number || "Not provided"}
              </p>
            </div>
          </div>

          <StatusBadge status={status} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        
        {/* Performance Rating */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Performance Rating</p>
            <StarRating rating={performanceRating} />
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Completion Rate</p>
            <p className="text-lg font-bold text-gray-900">{completionRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <CheckCircleIcon />
              <p className="text-xs">Completed</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{completed_deliveries}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <TruckIcon />
              <p className="text-xs">Total</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{total_deliveries}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="text-xs">Distance</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{total_distance_km.toFixed(0)}<span className="text-sm text-gray-500">km</span></p>
          </div>
        </div>

        {/* Vehicle Assignment */}
        {vehicle ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <TruckIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-600 font-medium">Assigned Vehicle</p>
              <p className="font-semibold text-blue-900 truncate">{vehicle.registration_number}</p>
              <p className="text-xs text-blue-700 capitalize">{vehicle.vehicle_type} • {vehicle.capacity_kg}kg capacity</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-500">No vehicle assigned</p>
            {isAdmin && onAssignVehicle && (
              <button
                onClick={() => onAssignVehicle(driver)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Assign Vehicle
              </button>
            )}
          </div>
        )}

        {/* Last Location Update */}
        {current_latitude && current_longitude && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <LocationIcon />
            <span>Last updated: {formatLastUpdate(last_location_update)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      {showActions && (
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          
          {/* Status Selector (for driver himself or admin) */}
          {onUpdateStatus && (
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdatingStatus}
              className="
                px-3 py-2 rounded-lg border border-gray-300
                text-sm font-medium
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <option value="available">Available</option>
              <option value="on_duty">On Duty</option>
              <option value="off_duty">Off Duty</option>
            </select>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(driver)}
                className="
                  px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg
                  hover:bg-blue-700 transition-colors duration-150
                "
              >
                View Details
              </button>
            )}

            {isAdmin && onAssignVehicle && (
              <button
                onClick={() => onAssignVehicle(driver)}
                className="
                  px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg
                  hover:bg-gray-50 transition-colors duration-150
                  flex items-center gap-1
                "
              >
                <TruckIcon />
                {vehicle ? "Change" : "Assign"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverCard;