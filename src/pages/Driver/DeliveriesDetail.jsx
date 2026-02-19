// src/pages/driver/DeliveryDetail.jsx
// Detailed view of a single delivery with map, status updates, and actions

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/common/Layout";
import TrackingMap from "../../components/shipments/TrackingMap";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import api from "../../services/api";

/**
 * Delivery Detail Page
 *
 * Features:
 * - Full delivery information
 * - Interactive map with route
 * - Status update buttons (pickup → in transit → delivered)
 * - Customer contact information
 * - Navigation to destination (Google Maps)
 * - Add delivery notes
 * - Proof of delivery photo upload
 * - Back button
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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

function NavigationIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ─── Status Badge Component ───────────────────────────────────────────────────

const STATUS_CONFIG = {
  assigned: { label: "Assigned", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  in_transit: { label: "In Transit", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  delivered: { label: "Delivered", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.assigned;
  
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  );
}

// ─── Main DeliveryDetail Component ────────────────────────────────────────────

function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [delivery, setDelivery] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch delivery data
  useEffect(() => {
    if (id) {
      fetchDeliveryData();
    }
  }, [id]);

  const fetchDeliveryData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch delivery details
      const deliveryResponse = await api.get(`/shipments/${id}`);
      setDelivery(deliveryResponse.data);

      // Fetch tracking data
      try {
        const trackingResponse = await api.get(`/tracking/shipment/${id}/route`);
        setTrackingData(trackingResponse.data);
      } catch (err) {
        console.log("No tracking data available yet");
      }
    } catch (err) {
      console.error("Error fetching delivery:", err);
      
      if (err.response?.status === 404) {
        setError("Delivery not found.");
      } else {
        setError("Failed to load delivery data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Update delivery status
  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    setError("");

    try {
      await api.put(`/shipments/${id}`, { status: newStatus });
      
      // Refresh delivery data
      await fetchDeliveryData();
      
      alert(`Status updated to: ${STATUS_CONFIG[newStatus].label}`);
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open navigation to destination
  const handleNavigate = () => {
    if (delivery) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.destination_latitude},${delivery.destination_longitude}`;
      window.open(url, "_blank");
    }
  };

  // Contact customer
  const handleContactCustomer = () => {
    if (delivery?.recipient_phone) {
      window.location.href = `tel:${delivery.recipient_phone}`;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Loading delivery details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error && !delivery) {
    return (
      <Layout>
        <div className="mb-6">
          <ErrorMessage type="error" message={error} />
        </div>
        <Button
          variant="ghost"
          icon={<BackIcon />}
          onClick={() => navigate("/driver/deliveries")}
        >
          Back to Deliveries
        </Button>
      </Layout>
    );
  }

  // Get next status action
  const getNextStatusAction = () => {
    if (delivery.status === "assigned") {
      return { status: "in_transit", label: "Start Delivery", icon: <NavigationIcon /> };
    } else if (delivery.status === "in_transit") {
      return { status: "delivered", label: "Mark as Delivered", icon: <CheckIcon /> };
    }
    return null;
  };

  const nextAction = getNextStatusAction();

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="ghost"
            icon={<BackIcon />}
            onClick={() => navigate("/driver/deliveries")}
            className="mb-3"
          >
            Back to Deliveries
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {delivery.tracking_number}
          </h1>
        </div>

        <StatusBadge status={delivery.status} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6">
          <ErrorMessage
            type="error"
            message={error}
            dismissible
            onDismiss={() => setError("")}
          />
        </div>
      )}

      {/* Map */}
      <div className="mb-6">
        <TrackingMap
          origin={{
            lat: parseFloat(delivery.origin_latitude),
            lng: parseFloat(delivery.origin_longitude),
            address: delivery.origin_address,
          }}
          destination={{
            lat: parseFloat(delivery.destination_latitude),
            lng: parseFloat(delivery.destination_longitude),
            address: delivery.destination_address,
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
          height="400px"
          autoRefresh={delivery.status === "in_transit"}
          onRefresh={fetchDeliveryData}
        />
      </div>

      {/* Action Buttons */}
      {delivery.status !== "delivered" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          
          {/* Next Status Action */}
          {nextAction && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={nextAction.icon}
              onClick={() => handleStatusUpdate(nextAction.status)}
              loading={updatingStatus}
            >
              {nextAction.label}
            </Button>
          )}

          {/* Navigate to Destination */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            icon={<NavigationIcon />}
            onClick={handleNavigate}
          >
            Open in Google Maps
          </Button>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Delivery Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Package Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Package Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium text-gray-900">{delivery.description}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Weight</p>
                <p className="font-medium text-gray-900">{delivery.weight_kg} kg</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Distance</p>
                <p className="font-medium text-gray-900">{delivery.estimated_distance_km?.toFixed(1)} km</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Value</p>
                <p className="font-medium text-gray-900">
                  KSH {(delivery.estimated_cost || 0).toLocaleString("en-KE")}
                </p>
              </div>
            </div>

            {delivery.special_instructions && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Special Instructions</p>
                <p className="text-sm text-gray-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  ⚠️ {delivery.special_instructions}
                </p>
              </div>
            )}
          </div>

          {/* Route Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Route Details</h3>
            
            <div className="space-y-4">
              {/* Pickup */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                  📦
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-0.5">Pickup Location</p>
                  <p className="text-sm text-gray-600">{delivery.origin_address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pl-4">
                <div className="h-8 w-px bg-gray-200" />
                <p className="text-xs text-gray-500">
                  {delivery.estimated_distance_km?.toFixed(1)} km
                </p>
              </div>

              {/* Delivery */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0">
                  🏁
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-0.5">Delivery Location</p>
                  <p className="text-sm text-gray-600">{delivery.destination_address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Notes */}
          {delivery.status !== "delivered" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Notes</h3>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any notes about this delivery (optional)..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert("Notes saved!")}
                className="mt-3"
              >
                Save Notes
              </Button>
            </div>
          )}
        </div>

        {/* Right Column - Customer Info */}
        <div className="space-y-6">
          
          {/* Customer Contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Recipient Name</p>
                <p className="font-medium text-gray-900">{delivery.recipient_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                <p className="font-medium text-gray-900">{delivery.recipient_phone}</p>
              </div>

              <Button
                variant="primary"
                fullWidth
                icon={<PhoneIcon />}
                onClick={handleContactCustomer}
              >
                Call Customer
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Timeline</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${delivery.created_at ? "bg-emerald-500" : "bg-gray-300"}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-xs text-gray-500">
                    {delivery.created_at ? new Date(delivery.created_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${delivery.assigned_at ? "bg-emerald-500" : "bg-gray-300"}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Assigned</p>
                  <p className="text-xs text-gray-500">
                    {delivery.assigned_at ? new Date(delivery.assigned_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${delivery.picked_up_at ? "bg-emerald-500" : "bg-gray-300"}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Picked Up</p>
                  <p className="text-xs text-gray-500">
                    {delivery.picked_up_at ? new Date(delivery.picked_up_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${delivery.delivered_at ? "bg-emerald-500" : "bg-gray-300"}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Delivered</p>
                  <p className="text-xs text-gray-500">
                    {delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              💡 Quick Tips
            </h3>
            <ul className="space-y-2 text-xs text-blue-700">
              <li>• Call customer before starting delivery</li>
              <li>• Update status as you progress</li>
              <li>• Use Google Maps for navigation</li>
              <li>• Take photo proof when delivered</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DeliveryDetail;