// src/pages/customer/Dashboard.jsx
// Customer dashboard with stats, recent shipments, and quick actions

import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Layout from "../../components/common/Layout";
import StatCard from "../../components/analytics/StatCard";
import ShipmentList from "../../components/shipments/ShipmentList";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import api from "../../services/api";

/**
 * Customer Dashboard
 *
 * Features:
 * - Welcome message with user name
 * - 4 KPI stat cards (active, delivered, cancelled, total spent)
 * - Recent shipments list (last 5)
 * - Quick action button (Create New Shipment)
 * - Auto-refresh data
 * - Loading states
 * - Error handling
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function PackageIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // State
  const [stats, setStats] = useState(null);
  const [recentShipments, setRecentShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all shipments for this customer
      const shipmentsResponse = await api.get("/shipments");
      const shipments = shipmentsResponse.data;

      // Calculate stats
      const activeCount = shipments.filter(
        (s) => s.status === "pending" || s.status === "assigned" || s.status === "in_transit"
      ).length;

      const deliveredCount = shipments.filter((s) => s.status === "delivered").length;
      const cancelledCount = shipments.filter((s) => s.status === "cancelled").length;

      const totalSpent = shipments
        .filter((s) => s.status === "delivered")
        .reduce((sum, s) => sum + (s.actual_cost || s.estimated_cost || 0), 0);

      setStats({
        active: activeCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        totalSpent: totalSpent,
      });

      // Get recent shipments (last 5)
      const recent = shipments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setRecentShipments(recent);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle shipment tracking
  const handleTrackShipment = (shipment) => {
    navigate(`/customer/track/${shipment.id}`);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Layout>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getGreeting()}, {user?.full_name?.split(" ")[0] || "there"}! 👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your shipments today.
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Shipments"
          value={stats?.active || 0}
          subtitle="In progress"
          icon={<PackageIcon />}
          color="blue"
          loading={loading}
          onClick={() => navigate("/customer/shipments")}
        />

        <StatCard
          title="Delivered"
          value={stats?.delivered || 0}
          subtitle="Completed"
          icon={<CheckCircleIcon />}
          color="emerald"
          loading={loading}
        />

        <StatCard
          title="Cancelled"
          value={stats?.cancelled || 0}
          subtitle="Not delivered"
          icon={<XCircleIcon />}
          color="red"
          loading={loading}
        />

        <StatCard
          title="Total Spent"
          value={`KSH ${(stats?.totalSpent || 0).toLocaleString("en-KE")}`}
          subtitle="All time"
          icon={<DollarIcon />}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h3 className="text-xl font-bold mb-1">Need to send a package?</h3>
            <p className="text-blue-100 text-sm">
              Create a new shipment in just a few clicks
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            icon={<PlusIcon />}
            onClick={() => navigate("/customer/shipments/create")}
            className="bg-white text-blue-600 hover:bg-gray-50"
          >
            New Shipment
          </Button>
        </div>
      </div>

      {/* Recent Shipments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Shipments</h2>
            <p className="text-sm text-gray-500 mt-0.5">Your latest 5 shipments</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/customer/shipments")}
          >
            View All
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-gray-500 text-sm">Loading shipments...</p>
          </div>
        ) : recentShipments.length === 0 ? (
          <div className="text-center py-12">
            <TruckIcon />
            <p className="text-gray-500 mt-2">No shipments yet</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/customer/shipments/create")}
              className="mt-4"
            >
              Create Your First Shipment
            </Button>
          </div>
        ) : (
          <ShipmentList
            shipments={recentShipments}
            onTrack={handleTrackShipment}
            compact={true}
            showFilters={false}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-1">
              Need Help?
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Our support team is here to assist you with any questions about your shipments.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="tel:+254722000000"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                📞 Call: +254 722 000 000
              </a>
              <span className="text-blue-300">|</span>
              <a
                href="mailto:support@antu.com"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ✉️ Email: support@antu.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CustomerDashboard;