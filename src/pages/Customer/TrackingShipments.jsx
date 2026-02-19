// src/pages/customer/TrackShipment.jsx
// Track shipment with real-time map, timeline, and auto-refresh

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/common/Layout";
import TrackingMap from "../../components/shipments/TrackingMap";
import ShipmentCard from "../../components/shipments/ShipmentCard";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import api from "../../services/api";

/**
 * Track Shipment Page
 *
 * Features:
 * - Real-time map showing shipment route
 * - Shipment details card
 * - Status timeline (created → assigned → in transit → delivered)
 * - Auto-refresh every 30 seconds for active shipments
 * - Driver information
 * - Estimated delivery time
 * - Contact driver button (if assigned)
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

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

function BackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

// ─── Status Timeline Component ────────────────────────────────────────────────

function StatusTimeline({ shipment }) {
  const statuses = [
    { key: "pending", label: "Created", icon: "📦" },
    { key: "assigned", label: "Assigned", icon: "👤" },
    { key: "in_transit", label: "In Transit", icon: "🚚" },
    { key: "delivered", label: "Delivered", icon: "✅" },
  ];

  const currentIndex = statuses.findIndex((s) => s.key === shipment.status);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Shipment Status</h3>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200" />
        <div
          className="absolute left-6 top-6 w-0.5 bg-blue-600 transition-all duration-500"
          style={{
            height: `${(currentIndex / (statuses.length - 1)) * 100}%`,
          }}
        />

        {/* Timeline Steps */}
        <div className="space-y-8">
          {statuses.map((status, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={status.key} className="relative flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`
                    relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                    text-xl border-2 transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }
                    ${isCurrent ? "ring-4 ring-blue-100" : ""}
                  `}
                >
                  {status.icon}
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
                      <>Created {new Date(shipment.created_at).toLocaleDateString()}</>
                    )}
                    {status.key === "assigned" && shipment.assigned_at && (
                      <>Assigned {new Date(shipment.assigned_at).toLocaleDateString()}</>
                    )}
                    {status.key === "in_transit" && shipment.picked_up_at && (
                      <>Picked up {new Date(shipment.picked_up_at).toLocaleDateString()}</>
                    )}
                    {status.key === "delivered" && shipment.delivered_at && (
                      <>Delivered {new Date(shipment.delivered_at).toLocaleDateString()}</>
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

// ─── Main TrackShipment Component ─────────────────────────────────────────────

function TrackShipment() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [shipment, setShipment] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch shipment and tracking data
  useEffect(() => {
    if (id) {
      fetchShipmentData();
    }
  }, [id]);

  // Auto-refresh for active shipments
  useEffect(() => {
    if (!shipment) return;

    const isActive =
      shipment.status === "assigned" || shipment.status === "in_transit";

    if (isActive) {
      const interval = setInterval(() => {
        fetchTrackingData();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [shipment]);

  // Fetch shipment details
  const fetchShipmentData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch shipment details
      const shipmentResponse = await api.get(`/shipments/${id}`);
      setShipment(shipmentResponse.data);

      // Fetch tracking data
      await fetchTrackingData();
    } catch (err) {
      console.error("Error fetching shipment:", err);

      if (err.response?.status === 404) {
        setError("Shipment not found. Please check the tracking number.");
      } else {
        setError("Failed to load shipment data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch tracking data only
  const fetchTrackingData = async () => {
    try {
      const trackingResponse = await api.get(`/tracking/shipment/${id}/route`);
      setTrackingData(trackingResponse.data);
    } catch (err) {
      console.error("Error fetching tracking data:", err);
      // Don't show error for tracking data - shipment details are more important
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

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Loading shipment details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !shipment) {
    return (
      <Layout>
        <div className="mb-6">
          <ErrorMessage type="error" message={error || "Shipment not found"} />
        </div>
        <Button variant="ghost" icon={<BackIcon />} onClick={() => navigate("/customer/shipments")}>
          Back to Shipments
        </Button>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="ghost"
            icon={<BackIcon />}
            onClick={() => navigate("/customer/shipments")}
            className="mb-3"
          >
            Back to Shipments
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Track Shipment: {shipment.tracking_number}
          </h1>
        </div>

        {/* ETA Badge */}
        {shipment.status !== "delivered" && shipment.status !== "cancelled" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2 text-blue-600">
              <ClockIcon />
              <div>
                <p className="text-xs font-medium">Estimated Delivery</p>
                <p className="text-sm font-bold">{getETA()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="mb-6">
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
          onRefresh={fetchTrackingData}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline (Left) */}
        <div className="lg:col-span-1">
          <StatusTimeline shipment={shipment} />
        </div>

        {/* Details (Right) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shipment Card */}
          <ShipmentCard
            shipment={shipment}
            showActions={false}
            compact={false}
          />

          {/* Driver Info (if assigned) */}
          {shipment.driver && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Driver Information</h3>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {shipment.driver.user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "DR"}
                </div>
                
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {shipment.driver.user?.full_name || "Driver"}
                  </p>
                  <p className="text-sm text-gray-500">
                    License: {shipment.driver.license_number || "N/A"}
                  </p>
                </div>

                {shipment.driver.user?.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<PhoneIcon />}
                    onClick={() => window.location.href = `tel:${shipment.driver.user.phone}`}
                  >
                    Call Driver
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Recipient Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recipient Details</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{shipment.recipient_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{shipment.recipient_phone}</p>
              </div>
              
              {shipment.special_instructions && (
                <div>
                  <p className="text-sm text-gray-500">Special Instructions</p>
                  <p className="font-medium text-gray-900">{shipment.special_instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default TrackShipment;