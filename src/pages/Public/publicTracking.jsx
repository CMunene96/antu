// src/pages/public/PublicTracking.jsx
// Public tracking page - no authentication required

import { useState } from "react";
import TrackingMap from "../../components/shipments/TrackingMap";
import ErrorMessage from "../../components/common/ErrorMessage";
import Button from "../../components/common/Button";
import api from "../../services/api";

/**
 * Public Tracking Page
 *
 * Features:
 * - No login required - fully public
 * - Track by tracking number
 * - Shows shipment status
 * - Live map with route
 * - Status timeline
 * - Estimated delivery time
 * - Contact info (phone only, no personal details)
 * - Clean, professional design
 * - Sharable URL (/track?number=ANTU-xxx)
 * - Error handling for invalid tracking numbers
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm8 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 8l1.5-4h13l1.5 4M3 8h18M3 8v6m18-6v6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: "Order Placed",
    color: "bg-gray-100 text-gray-700",
    icon: "📦",
    message: "Your shipment has been created and is awaiting assignment.",
  },
  assigned: {
    label: "Driver Assigned",
    color: "bg-blue-100 text-blue-700",
    icon: "👤",
    message: "A driver has been assigned and will pick up your package soon.",
  },
  in_transit: {
    label: "In Transit",
    color: "bg-amber-100 text-amber-700",
    icon: "🚚",
    message: "Your package is on the way to its destination.",
  },
  delivered: {
    label: "Delivered",
    color: "bg-emerald-100 text-emerald-700",
    icon: "✅",
    message: "Your package has been successfully delivered!",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: "❌",
    message: "This shipment has been cancelled.",
  },
};

// ─── Status Timeline Component ────────────────────────────────────────────────

function StatusTimeline({ shipment }) {
  const statuses = [
    { key: "pending", label: "Created" },
    { key: "assigned", label: "Assigned" },
    { key: "in_transit", label: "In Transit" },
    { key: "delivered", label: "Delivered" },
  ];

  const currentIndex = statuses.findIndex((s) => s.key === shipment.status);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Tracking Progress</h3>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200" />
        <div
          className="absolute left-6 top-6 w-0.5 bg-emerald-500 transition-all duration-500"
          style={{
            height: `${(currentIndex / (statuses.length - 1)) * 100}%`,
          }}
        />

        {/* Timeline Steps */}
        <div className="space-y-8">
          {statuses.map((status, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const config = STATUS_CONFIG[status.key];

            return (
              <div key={status.key} className="relative flex items-start gap-4">
                {/* Icon Circle */}
                <div
                  className={`
                    relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                    text-xl border-2 transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }
                    ${isCurrent ? "ring-4 ring-emerald-100 scale-110" : ""}
                  `}
                >
                  {isCompleted ? "✓" : config?.icon || "○"}
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <p
                    className={`
                      font-semibold
                      ${isCompleted ? "text-gray-900" : "text-gray-400"}
                    `}
                  >
                    {status.label}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {status.key === "pending" && shipment.created_at && (
                      <>{new Date(shipment.created_at).toLocaleString()}</>
                    )}
                    {status.key === "assigned" && shipment.assigned_at && (
                      <>{new Date(shipment.assigned_at).toLocaleString()}</>
                    )}
                    {status.key === "in_transit" && shipment.picked_up_at && (
                      <>{new Date(shipment.picked_up_at).toLocaleString()}</>
                    )}
                    {status.key === "delivered" && shipment.delivered_at && (
                      <>{new Date(shipment.delivered_at).toLocaleString()}</>
                    )}
                    {!isCompleted && "Pending"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main PublicTracking Component ────────────────────────────────────────────

function PublicTracking() {
  // State
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check URL params on mount
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const number = params.get("number");
    if (number) {
      setTrackingNumber(number);
      handleTrack(number);
    }
  }, []);

  // Track shipment
  const handleTrack = async (numberToTrack) => {
    const number = numberToTrack || trackingNumber;
    
    if (!number.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    setLoading(true);
    setError("");
    setShipment(null);
    setTrackingData(null);

    try {
      // Search for shipment by tracking number
      const shipmentsResponse = await api.get("/shipments/public/track", {
        params: { tracking_number: number }
      });

      if (shipmentsResponse.data) {
        setShipment(shipmentsResponse.data);

        // Get tracking data
        try {
          const trackingResponse = await api.get(
            `/tracking/shipment/${shipmentsResponse.data.id}/route`
          );
          setTrackingData(trackingResponse.data);
        } catch (err) {
          console.log("No tracking data available");
        }
      } else {
        setError("Tracking number not found. Please check and try again.");
      }
    } catch (err) {
      console.error("Error tracking shipment:", err);
      
      if (err.response?.status === 404) {
        setError("Tracking number not found. Please check and try again.");
      } else {
        setError("Unable to track shipment. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate ETA
  const getETA = () => {
    if (shipment?.status === "delivered") return "Delivered";
    if (!shipment?.estimated_delivery_time_hours) return "Calculating...";

    const now = new Date();
    const createdAt = new Date(shipment.created_at);
    const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(
      0,
      shipment.estimated_delivery_time_hours - hoursElapsed
    );

    if (hoursRemaining < 1) return "Less than 1 hour";
    if (hoursRemaining < 24) return `${Math.round(hoursRemaining)} hours`;

    const days = Math.round(hoursRemaining / 24);
    return `${days} ${days === 1 ? "day" : "days"}`;
  };

  const statusConfig = shipment ? STATUS_CONFIG[shipment.status] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <TruckIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Antu Logistics</h1>
              <p className="text-sm text-gray-600">Track Your Shipment</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <PackageIcon />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Track Your Package</h2>
                <p className="text-sm text-gray-600">Enter your tracking number below</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTrack();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tracking Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                    placeholder="ANTU-20250210-A7K9M"
                    className="w-full px-4 py-4 pr-12 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg font-mono transition-all"
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400">
                    <SearchIcon />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                icon={<SearchIcon />}
              >
                {loading ? "Tracking..." : "Track Shipment"}
              </Button>
            </form>

            {/* Example */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Example: ANTU-20250210-A7K9M
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <ErrorMessage
              type="error"
              message={error}
              dismissible
              onDismiss={() => setError("")}
            />
          </div>
        )}

        {/* Results */}
        {shipment && (
          <div className="space-y-6">
            
            {/* Status Banner */}
            <div className={`rounded-xl p-6 ${statusConfig?.color} border-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{statusConfig?.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{statusConfig?.label}</h3>
                    <p className="text-sm opacity-90">{statusConfig?.message}</p>
                  </div>
                </div>

                {shipment.status !== "delivered" && shipment.status !== "cancelled" && (
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-gray-700 mb-1">
                      <ClockIcon />
                      <span className="text-sm font-medium">Estimated Delivery</span>
                    </div>
                    <p className="text-xl font-bold">{getETA()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            {shipment.status !== "pending" && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
                <TrackingMap
                  origin={{
                    lat: parseFloat(shipment.origin_latitude),
                    lng: parseFloat(shipment.origin_longitude),
                    address: shipment.origin_address,
                  }}
                  destination={{
                    lat: parseFloat(shipment.destination_latitude),
                    lng: parseFloat(shipment.destination_longitude),
                    address: shipment.destination_address,
                  }}
                  currentLocation={
                    trackingData?.current_location
                      ? {
                          lat: trackingData.current_location.latitude,
                          lng: trackingData.current_location.longitude,
                          timestamp: trackingData.current_location.timestamp,
                        }
                      : null
                  }
                  route={trackingData?.route || []}
                  height="500px"
                  autoRefresh={shipment.status === "in_transit"}
                  onRefresh={() => handleTrack(trackingNumber)}
                />
              </div>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Timeline */}
              <div className="lg:col-span-1">
                <StatusTimeline shipment={shipment} />
              </div>

              {/* Details */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Shipment Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Shipment Details</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-600 text-xl">📦</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-0.5">Pickup Location</p>
                        <p className="font-medium text-gray-900">{shipment.origin_address}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-300 pl-4">
                      <div className="h-8 w-px bg-gray-200" />
                      <p className="text-sm text-gray-500">
                        {shipment.estimated_distance_km?.toFixed(1)} km
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-red-600 text-xl">🏁</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-0.5">Delivery Location</p>
                        <p className="font-medium text-gray-900">{shipment.destination_address}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Weight</p>
                          <p className="font-semibold text-gray-900">{shipment.weight_kg} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
                          <p className="font-semibold text-gray-900 font-mono text-sm">
                            {shipment.tracking_number}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Support */}
                <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Need Help?</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Contact our customer support team for assistance with your shipment.
                  </p>
                  <div className="flex items-center gap-4">
                    <a
                      href="tel:+254722000000"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <PhoneIcon />
                      Call: +254 722 000 000
                    </a>
                    <a
                      href="mailto:support@antu.com"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Email Support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600">
            © 2025 Antu Logistics. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PublicTracking;