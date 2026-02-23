// src/pages/admin/Analytics.jsx
// Detailed analytics page with comprehensive charts and reports

import { useState, useEffect } from "react";
import Layout from "../../components/common/Layout";
import StatCard from "../../components/analytics/StatCard";
import RevenueChart from "../../components/analytics/RevenueChart";
import PerformanceChart from "../../components/analytics/PerformanceChart";
import ErrorMessage from "../../components/common/ErrorMessage";
import api from "../../services/api";

/**
 * Analytics Page (Admin)
 *
 * Features:
 * - Revenue analytics with trends
 * - Driver performance rankings
 * - Customer spending rankings
 * - Vehicle utilization
 * - Time period selector (week, month, year)
 * - Export reports
 * - KPI comparisons
 */

function Analytics() {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topDrivers, setTopDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const overviewResponse = await api.get("/analytics/overview");
      setStats(overviewResponse.data);

      const revenueResponse = await api.get("/analytics/revenue", {
        params: { period, limit: period === "week" ? 7 : period === "month" ? 6 : 12 }
      });
      setRevenueData(revenueResponse.data);

      const driversResponse = await api.get("/analytics/drivers/top", { params: { limit: 15 } });
      setTopDrivers(driversResponse.data.map(d => ({
        name: d.driver_name,
        value: d.completed_deliveries,
        label: `${d.completed_deliveries} deliveries`,
      })));
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Analytics & Reports">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive insights and reports</p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage type="error" message={error} dismissible onDismiss={() => setError("")} />
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Revenue"
          value={`KSH ${(stats?.total_revenue || 0).toLocaleString()}`}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title="Shipments"
          value={stats?.total_shipments || 0}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Avg. Cost"
          value={`KSH ${(stats?.average_cost || 0).toLocaleString()}`}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Completion"
          value={`${(stats?.completion_rate || 0).toFixed(1)}%`}
          color="amber"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueChart
          data={revenueData}
          title="Revenue Over Time"
          dataKeys={["revenue"]}
          colors={["#10b981"]}
          showControls={true}
          loading={loading}
        />

        <PerformanceChart
          data={topDrivers}
          title="Driver Performance"
          subtitle="Top 15 drivers"
          showTopN={15}
          colorScheme="gradient"
          loading={loading}
        />
      </div>
    </Layout>
  );
}

export default Analytics;