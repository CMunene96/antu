// src/pages/admin/Dashboard.jsx
// Admin dashboard with comprehensive analytics, stats, and quick actions

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/common/Layout";
import StatCard from "../../components/analytics/StatCard";
import RevenueChart from "../../components/analytics/RevenueChart";
import PerformanceChart from "../../components/analytics/PerformanceChart";
import ErrorMessage from "../../components/common/ErrorMessage";
import Button from "../../components/common/Button";
import api from "../../services/api";

/**
 * Admin Dashboard
 *
 * Features:
 * - Welcome message
 * - 6 KPI stat cards (revenue, shipments, drivers, vehicles, customers, completion rate)
 * - Revenue chart (last 6 months)
 * - Top drivers performance chart
 * - Top customers chart
 * - Recent activity feed
 * - Quick action buttons
 * - System health indicators
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function DollarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

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

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

function VehicleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm8 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 8l1.5-4h13l1.5 4M3 8h18M3 8v6m18-6v6" />
    </svg>
  );
}

// ─── Main Admin Dashboard Component ───────────────────────────────────────────

function AdminDashboard() {
  const navigate = useNavigate();

  // State
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topDrivers, setTopDrivers] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch overview stats
      const overviewResponse = await api.get("/analytics/overview");
      setStats(overviewResponse.data);

      // Fetch revenue data (last 6 months)
      const revenueResponse = await api.get("/analytics/revenue", {
        params: { period: "month", limit: 6 }
      });
      setRevenueData(revenueResponse.data);

      // Fetch top drivers
      const driversResponse = await api.get("/analytics/drivers/top", {
        params: { limit: 10 }
      });
      setTopDrivers(driversResponse.data.map(d => ({
        name: d.driver_name,
        value: d.completed_deliveries,
        label: `${d.completed_deliveries} deliveries`,
        additional: `${d.completion_rate.toFixed(1)}% completion rate`
      })));

      // Fetch top customers
      const customersResponse = await api.get("/analytics/customers/top", {
        params: { limit: 10 }
      });
      setTopCustomers(customersResponse.data.map(c => ({
        name: c.customer_name,
        value: c.total_spent,
        label: `KSH ${c.total_spent.toLocaleString("en-KE")}`,
        additional: `${c.shipment_count} shipments`
      })));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard 👨‍💼
        </h1>
        <p className="text-gray-600">
          Complete overview of your logistics operations
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

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={`KSH ${(stats?.total_revenue || 0).toLocaleString("en-KE")}`}
          subtitle="All time"
          trend="up"
          trendValue={stats?.revenue_growth || 0}
          icon={<DollarIcon />}
          color="emerald"
          loading={loading}
          onClick={() => navigate("/admin/analytics")}
        />

        <StatCard
          title="Total Shipments"
          value={stats?.total_shipments || 0}
          subtitle="All time"
          trend={stats?.shipments_trend || "neutral"}
          trendValue={stats?.shipments_growth || 0}
          icon={<PackageIcon />}
          color="blue"
          loading={loading}
          onClick={() => navigate("/admin/shipments")}
        />

        <StatCard
          title="Active Drivers"
          value={stats?.active_drivers || 0}
          subtitle={`${stats?.total_drivers || 0} total`}
          icon={<TruckIcon />}
          color="purple"
          loading={loading}
          onClick={() => navigate("/admin/drivers")}
        />
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Vehicles"
          value={stats?.total_vehicles || 0}
          subtitle={`${stats?.available_vehicles || 0} available`}
          icon={<VehicleIcon />}
          color="amber"
          loading={loading}
          onClick={() => navigate("/admin/vehicles")}
        />

        <StatCard
          title="Total Customers"
          value={stats?.total_customers || 0}
          subtitle="Registered users"
          icon={<UsersIcon />}
          color="blue"
          loading={loading}
        />

        <StatCard
          title="Completion Rate"
          value={`${(stats?.completion_rate || 0).toFixed(1)}%`}
          subtitle="Success rate"
          trend={stats?.completion_rate >= 90 ? "up" : "neutral"}
          trendValue={stats?.completion_rate_change || 0}
          icon={<CheckCircleIcon />}
          color={stats?.completion_rate >= 90 ? "emerald" : "amber"}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Button
          variant="primary"
          fullWidth
          onClick={() => navigate("/admin/drivers")}
        >
          Manage Drivers
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => navigate("/admin/vehicles")}
        >
          Manage Vehicles
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={() => navigate("/admin/shipments")}
        >
          View All Shipments
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={() => navigate("/admin/analytics")}
        >
          Detailed Analytics
        </Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Revenue Chart */}
        <RevenueChart
          data={revenueData}
          title="Revenue Trend"
          subtitle="Last 6 months"
          dataKeys={["revenue"]}
          colors={["#10b981"]}
          showControls={true}
          loading={loading}
          height={300}
        />

        {/* Top Drivers */}
        <PerformanceChart
          data={topDrivers}
          title="Top Performing Drivers"
          subtitle="By completed deliveries"
          showTopN={10}
          colorScheme="gradient"
          loading={loading}
          height={300}
        />
      </div>

      {/* Top Customers */}
      <div className="mb-8">
        <PerformanceChart
          data={topCustomers}
          title="Top Customers"
          subtitle="By total spending"
          showTopN={10}
          colorScheme="performance"
          loading={loading}
          height={350}
        />
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Active Shipments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Active Shipments</h3>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.active_shipments || 0}
          </p>
          <p className="text-xs text-gray-500">Currently in progress</p>
        </div>

        {/* On-Duty Drivers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">On-Duty Drivers</h3>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.on_duty_drivers || 0}
          </p>
          <p className="text-xs text-gray-500">Currently working</p>
        </div>

        {/* Today's Deliveries */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Today's Deliveries</h3>
            <CheckCircleIcon />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.deliveries_today || 0}
          </p>
          <p className="text-xs text-gray-500">Completed today</p>
        </div>
      </div>
    </Layout>
  );
}

export default AdminDashboard;