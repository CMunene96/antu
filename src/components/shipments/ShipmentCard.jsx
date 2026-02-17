// src/components/shipments/ShipmentCard.jsx
// Displays one shipment — used in lists, dashboards, and driver views.

/**
 * PROPS:
 *  shipment        object   – shipment data from your API
 *  role            string   – "customer" | "driver" | "admin"
 *  onView          func     – called when "View Details" is clicked
 *  onAssign        func     – (admin) open the assign-driver modal
 *  onUpdateStatus  func     – (driver) open the status-update panel
 *  compact         bool     – slim row version for dense lists / tables
 *
 * SHIPMENT OBJECT SHAPE (from  FastAPI backend):
 *  {
 *    id, tracking_number, status,
 *    origin_address, destination_address,
 *    weight_kg, estimated_distance_km, estimated_cost,
 *    recipient_name, recipient_phone,
 *    created_at, assigned_at, picked_up_at, delivered_at,
 *    driver_id
 *  }
 *
 * USAGE:
 *  <ShipmentCard
 *    shipment={shipment}
 *    role="customer"
 *    onView={() => navigate(`/customer/shipments/${shipment.id}`)}
 *  />
 *
 *  <ShipmentCard shipment={s} role="admin" compact onView={...} onAssign={...} />
 */

import { useState } from "react";

// ─── Status configuration ───────────────────────────────────────────────────
// Each backend status maps to a colour theme, label, and progress percentage.

const STATUS = {
  pending: {
    label: "Pending",
    progress: 10,
    barColor: "#f59e0b",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    pulse: false,
  },
  assigned: {
    label: "Assigned",
    progress: 35,
    barColor: "#3b82f6",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    pulse: false,
  },
  in_transit: {
    label: "In Transit",
    progress: 70,
    barColor: "#6366f1",
    dot: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    pulse: true, // live indicator
  },
  delivered: {
    label: "Delivered",
    progress: 100,
    barColor: "#10b981",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pulse: false,
  },
  cancelled: {
    label: "Cancelled",
    progress: 0,
    barColor: "#ef4444",
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-600 border-red-200",
    pulse: false,
  },
};

// ─── Small utility helpers ──────────────────────────────────────────────────

// "Tom Mboya Street, CBD, Nairobi" → "Tom Mboya Street"
function shortAddr(addr) {
  if (!addr) return "—";
  return addr.split(",")[0].trim();
}

// Format number as KSH currency
function ksh(amount) {
  if (!amount && amount !== 0) return "—";
  return `KSH ${Number(amount).toLocaleString()}`;
}

// "2025-02-10T11:30:00" → "Feb 10, 11:30 AM"
function fmtDate(str) {
  if (!str) return null;
  return new Date(str).toLocaleString("en-KE", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// ─── Sub-components ─────────────────────────────────────────────────────────

// Animated live dot for in-transit status
function LivePulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
    </span>
  );
}

// Pill badge showing current shipment status
function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1
      rounded-full text-xs font-semibold border
      ${cfg.badge}
    `}>
      {cfg.pulse ? <LivePulse /> : <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
}

// Thin colour progress bar showing delivery lifecycle
function ProgressBar({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  const isCancelled = status === "cancelled";
  return (
    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-1 rounded-full transition-all duration-700"
        style={{
          width: isCancelled ? "100%" : `${cfg.progress}%`,
          backgroundColor: cfg.barColor,
          opacity: isCancelled ? 0.4 : 1,
        }}
      />
    </div>
  );
}

// "Origin → Destination" with coloured dots
function RouteLine({ origin, destination }) {
  return (
    <div className="flex items-center gap-2 text-sm min-w-0">
      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      <span className="font-medium text-gray-700 truncate">{shortAddr(origin)}</span>
      <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor"
        strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
      <span className="font-medium text-gray-700 truncate">{shortAddr(destination)}</span>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function ShipmentCard({
  shipment,
  role = "customer",
  onView,
  onAssign,
  onUpdateStatus,
  compact = false,
}) {
  const [hovered, setHovered] = useState(false);
  if (!shipment) return null;

  const cfg = STATUS[shipment.status] || STATUS.pending;

  // Pick the most relevant timestamp label to show
  const tsLabel = {
    pending:    "Created",
    assigned:   "Assigned",
    in_transit: "Picked up",
    delivered:  "Delivered",
    cancelled:  "Cancelled",
  }[shipment.status];

  const tsValue = {
    pending:    shipment.created_at,
    assigned:   shipment.assigned_at,
    in_transit: shipment.picked_up_at,
    delivered:  shipment.delivered_at,
    cancelled:  shipment.updated_at,
  }[shipment.status];

  // ── Compact / table-row version ────────────────────────────────────────────
  if (compact) {
    return (
      <div
        onClick={onView}
        className="flex items-center gap-4 px-4 py-3 border-b border-gray-100
          hover:bg-slate-50 cursor-pointer transition-colors group"
      >
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
        <span className="font-mono text-xs text-gray-400 w-40 shrink-0">
          {shipment.tracking_number}
        </span>
        <div className="flex-1 min-w-0">
          <RouteLine
            origin={shipment.origin_address}
            destination={shipment.destination_address}
          />
        </div>
        <div className="shrink-0 hidden sm:block">
          <StatusBadge status={shipment.status} />
        </div>
        <span className="text-sm font-semibold text-gray-900 shrink-0 hidden md:block">
          {ksh(shipment.estimated_cost)}
        </span>
        <svg
          className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    );
  }

  // ── Full card version ──────────────────────────────────────────────────────
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        bg-white rounded-2xl border overflow-hidden
        transition-all duration-200
        ${hovered
          ? "shadow-lg border-gray-300 -translate-y-0.5"
          : "shadow-sm border-gray-200"
        }
      `}
    >
      {/* Coloured top accent matching status */}
      <div className="h-1 w-full" style={{ backgroundColor: cfg.barColor }} />

      <div className="p-5">

        {/* Header: tracking number + badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">
              Tracking Number
            </p>
            <p className="font-mono text-sm font-bold text-gray-800">
              {shipment.tracking_number}
            </p>
          </div>
          <StatusBadge status={shipment.status} />
        </div>

        {/* Progress bar + stage labels */}
        <div className="mb-4">
          <ProgressBar status={shipment.status} />
          <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
            <span>Created</span>
            <span>Assigned</span>
            <span>Transit</span>
            <span>Delivered</span>
          </div>
        </div>

        {/* Route */}
        <div className="mb-4 px-3 py-2.5 bg-slate-50 rounded-xl">
          <RouteLine
            origin={shipment.origin_address}
            destination={shipment.destination_address}
          />
          {shipment.recipient_name && (
            <p className="mt-2 text-xs text-gray-400 pl-3.5">
              To: <span className="text-gray-600 font-medium">{shipment.recipient_name}</span>
              {shipment.recipient_phone && (
                <span className="text-gray-400"> · {shipment.recipient_phone}</span>
              )}
            </p>
          )}
        </div>

        {/* Stat chips */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center py-2.5 bg-slate-50 rounded-xl">
            <p className="text-[10px] text-gray-400 mb-0.5">Weight</p>
            <p className="text-sm font-bold text-gray-800">{shipment.weight_kg} kg</p>
          </div>
          <div className="text-center py-2.5 bg-slate-50 rounded-xl">
            <p className="text-[10px] text-gray-400 mb-0.5">Distance</p>
            <p className="text-sm font-bold text-gray-800">
              {shipment.estimated_distance_km ? `${shipment.estimated_distance_km} km` : "—"}
            </p>
          </div>
          <div className="text-center py-2.5 bg-blue-50 rounded-xl">
            <p className="text-[10px] text-blue-400 mb-0.5">Est. Cost</p>
            <p className="text-sm font-bold text-blue-700">
              {ksh(shipment.estimated_cost)}
            </p>
          </div>
        </div>

        {/* Timestamp */}
        {tsValue && (
          <p className="text-xs text-gray-400 mb-4">
            {tsLabel} · {fmtDate(tsValue)}
          </p>
        )}

        {/* Role-based action buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">

          {/* Everyone: View Details */}
          <button
            onClick={onView}
            className="flex-1 py-2 text-sm font-semibold text-blue-600
              border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
          >
            View Details
          </button>

          {/* Admin: Assign driver (only for pending) */}
          {role === "admin" && shipment.status === "pending" && onAssign && (
            <button
              onClick={onAssign}
              className="flex-1 py-2 text-sm font-semibold text-white
                bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Assign Driver
            </button>
          )}

          {/* Driver: Start pickup or mark delivered */}
          {role === "driver" &&
            ["assigned", "in_transit"].includes(shipment.status) &&
            onUpdateStatus && (
            <button
              onClick={onUpdateStatus}
              className="flex-1 py-2 text-sm font-semibold text-white
                bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              {shipment.status === "assigned" ? "Start Pickup" : "Mark Delivered"}
            </button>
          )}

          {/* Customer: Cancel when pending */}
          {role === "customer" && shipment.status === "pending" && (
            <button className="py-2 px-3 text-sm font-semibold text-red-500
              border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}