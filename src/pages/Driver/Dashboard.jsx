// src/pages/driver/Dashboard.jsx
// Driver dashboard with stats, status control, location sharing, and active deliveries

import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Layout from "../../components/common/Layout";
import StatCard from "../../components/analytics/statCard";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import LocationPicker from "../../components/drivers/LocationPicker";
import api from "../../services/api";

/**
 * Driver Dashboard
 *
 * Features:
 * - Welcome message with driver name
 * - Status selector (available, on_duty, off_duty)
 * - Location sharing toggle with auto-update
 * - 4 KPI stat cards (today's deliveries, total, completion rate, distance)
 * - Active deliveries list (quick view)
 * - Update location button
 * - Performance summary
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function TruckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm8 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 8l1.5-4h13l1.5 4M3 8h18M3 8v6m18-6v6" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "available", label: "Available", color: "bg-emerald-600", icon: "✓" },
  { value: "on_duty", label: "On Duty", color: "bg-blue-600", icon: "🚚" },
  { value: "off_duty", label: "Off Duty", color: "bg-gray-600", icon: "⏸" },
];

// ─── Main Driver Dashboard Component ──────────────────────────────────────────

function DriverDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // State
  const [driverData, setDriverData] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [status, setStatus] = useState("available");
  const [locationSharing, setLocationSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Fetch driver data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-update location when location sharing is ON and status is on_duty
  useEffect(() => {
    if (!locationSharing || status !== "on_duty") return;

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            api.put("/drivers/me/location", {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }).catch(err => console.error("Location update failed:", err));
          },
          (error) => console.error("Geolocation error:", error)
        );
      }
    };

    // Update immediately, then every 2 minutes
    updateLocation();
    const interval = setInterval(updateLocation, 120000); // 2 min

    return () => clearInterval(interval);
  }, [locationSharing, status]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch driver profile
      const driverResponse = await api.get("/drivers/me");
      setDriverData(driverResponse.data);
      setStatus(driverResponse.data.status);

      // Fetch driver statistics
      const statsResponse = await api.get(`/analytics/drivers/${driverResponse.data.id}/performance`);
      setStats(statsResponse.data);

      // Fetch active deliveries
      const deliveriesResponse = await api.get("/shipments", {
        params: { driver_id: driverResponse.data.id, status: "assigned,in_transit" }
      });
      setActiveDeliveries(deliveriesResponse.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    setError("");

    try {
      await api.put(`/drivers/${driverData.id}/status`, { status: newStatus });
      setStatus(newStatus);

      // Turn off location sharing if going off duty
      if (newStatus === "off_duty") {
        setLocationSharing(false);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle location update
  const handleLocationUpdate = async (location) => {
    try {
      await api.put("/drivers/me/location", {
        latitude: location.lat,
        longitude: location.lng,
      });

      setShowLocationPicker(false);
      alert("Location updated successfully!");
    } catch (err) {
      console.error("Error updating location:", err);
      setError("Failed to update location. Please try again.");
    }
  };

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Calculate completion rate
  const completionRate = stats?.total_deliveries > 0
    ? (stats.completed_deliveries / stats.total_deliveries * 100).toFixed(1)
    : 0;

  return (
    <Layout>
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getGreeting()}, {user?.full_name?.split(" ")[0] || "Driver"}! 🚚
        </h1>
        <p className="text-gray-600">
          Ready to deliver? Here's your dashboard for today.
        </p>
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

      {/* Status & Location Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        
        {/* Status Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TruckIcon />
            Your Status
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={updatingStatus}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200
                  ${status === option.value
                    ? `${option.color} border-transparent text-white`
                    : "border-gray-300 hover:border-gray-400 text-gray-700"
                  }
                  ${updatingStatus ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <p className="text-sm font-semibold">{option.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Location Sharing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <LocationIcon />
            Location Sharing
          </h3>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-update location</p>
              <p className="text-xs text-gray-500">Updates every 2 minutes when on duty</p>
            </div>
            <button
              onClick={() => setLocationSharing(!locationSharing)}
              disabled={status === "off_duty"}
              className={`
                relative w-14 h-7 rounded-full transition-colors duration-200
                ${locationSharing ? "bg-emerald-600" : "bg-gray-300"}
                ${status === "off_duty" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div
                className={`
                  absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full
                  transition-transform duration-200
                  ${locationSharing ? "translate-x-7" : "translate-x-0"}
                `}
              />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            fullWidth
            icon={<MapIcon />}
            onClick={() => setShowLocationPicker(true)}
          >
            Update Location Manually
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Deliveries"
          value={stats?.deliveries_today || 0}
          subtitle="Completed today"
          icon={<TruckIcon />}
          color="blue"
          loading={loading}
        />

        <StatCard
          title="Total Deliveries"
          value={stats?.completed_deliveries || 0}
          subtitle="All time"
          icon={<CheckCircleIcon />}
          color="emerald"
          loading={loading}
        />

        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          subtitle="Success rate"
          icon={<StarIcon />}
          color="amber"
          loading={loading}
        />

        <StatCard
          title="Distance Covered"
          value={`${stats?.total_distance_km?.toFixed(0) || 0} km`}
          subtitle="Total driven"
          icon={<MapIcon />}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Active Deliveries */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Active Deliveries</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeDeliveries.length} active {activeDeliveries.length === 1 ? "delivery" : "deliveries"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/driver/deliveries")}
          >
            View All
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeDeliveries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <TruckIcon />
            <p className="mt-2">No active deliveries</p>
            <p className="text-sm mt-1">New deliveries will appear here when assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                onClick={() => navigate(`/driver/deliveries/${delivery.id}`)}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{delivery.tracking_number}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {delivery.origin_address} → {delivery.destination_address}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${delivery.status === "assigned" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}
                  `}>
                    {delivery.status === "assigned" ? "Assigned" : "In Transit"}
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      {stats && (
        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Your Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_deliveries || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Distance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_distance_km?.toFixed(0) || 0} km</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rating</p>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Update Your Location</h2>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <LocationPicker
              initialLocation={{
                lat: parseFloat(driverData?.current_latitude) || -1.286389,
                lng: parseFloat(driverData?.current_longitude) || 36.817223,
              }}
              onLocationSelect={handleLocationUpdate}
              onCancel={() => setShowLocationPicker(false)}
              height="500px"
              showCurrentLocation={true}
              mode="picker"
            />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default DriverDashboard;