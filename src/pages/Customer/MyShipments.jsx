// src/pages/customer/MyShipments.jsx
// View all customer's shipments with filters and actions

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/common/Layout";
import ShipmentList from "../../components/shipments/ShipmentList";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import api from "../../services/api";

/**
 * My Shipments Page
 *
 * Features:
 * - Display all shipments for logged-in customer
 * - Filter by status
 * - Search by tracking number or address
 * - Pagination
 * - Track shipment action
 * - Cancel shipment action (for pending/assigned only)
 * - Create new shipment button
 * - Auto-refresh option
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function RefreshIcon({ spinning = false }) {
  return (
    <svg 
      className={`w-5 h-5 ${spinning ? "animate-spin" : ""}`}
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2} 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

// ─── Main MyShipments Component ───────────────────────────────────────────────

function MyShipments() {
  const navigate = useNavigate();

  // State
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [cancelError, setCancelError] = useState("");

  // Fetch shipments on mount
  useEffect(() => {
    fetchShipments();
  }, []);

  // Fetch all shipments
  const fetchShipments = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/shipments");
      setShipments(response.data);
    } catch (err) {
      console.error("Error fetching shipments:", err);
      setError("Failed to load shipments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh shipments
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShipments();
    setRefreshing(false);
  };

  // Handle track shipment
  const handleTrackShipment = (shipment) => {
    navigate(`/customer/track/${shipment.id}`);
  };

  // Handle cancel shipment
  const handleCancelShipment = async (shipment) => {
    // Confirm cancellation
    if (!window.confirm(`Are you sure you want to cancel shipment ${shipment.tracking_number}?`)) {
      return;
    }

    setCancelError("");

    try {
      // Cancel shipment (DELETE request)
      await api.delete(`/shipments/${shipment.id}`);

      // Refresh shipments list
      await fetchShipments();

      // Show success message briefly
      alert("Shipment cancelled successfully");
    } catch (err) {
      console.error("Error cancelling shipment:", err);
      
      if (err.response?.status === 400) {
        setCancelError("Cannot cancel this shipment. It may already be in transit or delivered.");
      } else if (err.response?.data?.detail) {
        setCancelError(err.response.data.detail);
      } else {
        setCancelError("Failed to cancel shipment. Please try again.");
      }
    }
  };

  // Calculate stats for display
  const stats = {
    total: shipments.length,
    active: shipments.filter(
      (s) => s.status === "pending" || s.status === "assigned" || s.status === "in_transit"
    ).length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
  };

  return (
    <Layout title="My Shipments">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600">
            {stats.total} total shipments • {stats.active} active • {stats.delivered} delivered
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshIcon spinning={refreshing} />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>

          {/* Create New Button */}
          <Button
            variant="primary"
            icon={<PlusIcon />}
            onClick={() => navigate("/customer/shipments/create")}
          >
            New Shipment
          </Button>
        </div>
      </div>

      {/* Error Messages */}
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

      {cancelError && (
        <div className="mb-6">
          <ErrorMessage
            type="warning"
            message={cancelError}
            dismissible
            onDismiss={() => setCancelError("")}
          />
        </div>
      )}

      {/* Info Card for First-Time Users */}
      {!loading && shipments.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-8 text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl text-white mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Welcome to Antu Logistics! 🎉
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't created any shipments yet. Get started by creating your first shipment now!
          </p>
          <Button
            variant="primary"
            size="lg"
            icon={<PlusIcon />}
            onClick={() => navigate("/customer/shipments/create")}
          >
            Create Your First Shipment
          </Button>
        </div>
      )}

      {/* Shipments List */}
      <ShipmentList
        shipments={shipments}
        onTrack={handleTrackShipment}
        onCancel={handleCancelShipment}
        loading={loading}
        emptyMessage="You don't have any shipments yet. Create your first one!"
        showFilters={true}
        compact={false}
      />

      {/* Help Section */}
      {shipments.length > 0 && (
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            💡 Quick Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Click <strong>"Track"</strong> on any shipment to see its real-time location and status</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>You can only cancel shipments that are <strong>Pending</strong> or <strong>Assigned</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Use the search and filters above to quickly find specific shipments</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Contact support at <strong>+254 722 000 000</strong> if you need help</span>
            </li>
          </ul>
        </div>
      )}
    </Layout>
  );
}

export default MyShipments;