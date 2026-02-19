// src/pages/driver/MyDeliveries.jsx
// View all assigned deliveries for the driver with filters

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/common/Layout";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import api from "../../services/api";

/**
 * My Deliveries Page
 *
 * Features:
 * - Display all deliveries assigned to this driver
 * - Filter by status (assigned, in_transit, delivered)
 * - Search by tracking number
 * - Quick view cards with key info
 * - Navigate to delivery details
 * - Refresh button
 * - Stats counter
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

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

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function ArrowRightIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ─── Status Badge Component ───────────────────────────────────────────────────

const STATUS_CONFIG = {
  assigned: { label: "Assigned", bg: "bg-blue-100", text: "text-blue-700" },
  in_transit: { label: "In Transit", bg: "bg-amber-100", text: "text-amber-700" },
  delivered: { label: "Delivered", bg: "bg-emerald-100", text: "text-emerald-700" },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.assigned;
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

// ─── Delivery Card Component ──────────────────────────────────────────────────

function DeliveryCard({ delivery, onClick }) {
  return (
    <div
      onClick={() => onClick(delivery)}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <PackageIcon />
          </div>
          <div>
            <p className="font-bold text-gray-900">{delivery.tracking_number}</p>
            <p className="text-xs text-gray-500">
              Created {new Date(delivery.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <StatusBadge status={delivery.status} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2">
          <span className="text-emerald-600 text-sm mt-0.5">📍</span>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Pickup</p>
            <p className="text-sm font-medium text-gray-900 line-clamp-1">
              {delivery.origin_address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          <ArrowRightIcon />
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex items-start gap-2">
          <span className="text-red-600 text-sm mt-0.5">📍</span>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Delivery</p>
            <p className="text-sm font-medium text-gray-900 line-clamp-1">
              {delivery.destination_address}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>⚖️ {delivery.weight_kg} kg</span>
          <span>📏 {delivery.estimated_distance_km?.toFixed(1)} km</span>
        </div>
        <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
          View Details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Main MyDeliveries Component ──────────────────────────────────────────────

function MyDeliveries() {
  const navigate = useNavigate();

  // State
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch deliveries on mount
  useEffect(() => {
    fetchDeliveries();
  }, []);

  // Filter deliveries when search or filter changes
  useEffect(() => {
    let filtered = [...deliveries];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    // Search by tracking number
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((d) =>
        d.tracking_number?.toLowerCase().includes(query) ||
        d.origin_address?.toLowerCase().includes(query) ||
        d.destination_address?.toLowerCase().includes(query)
      );
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, searchQuery, statusFilter]);

  // Fetch all deliveries for this driver
  const fetchDeliveries = async () => {
    setLoading(true);
    setError("");

    try {
      // Get driver profile first
      const driverResponse = await api.get("/drivers/me");
      const driverId = driverResponse.data.id;

      // Get all deliveries for this driver
      const response = await api.get("/shipments", {
        params: { driver_id: driverId }
      });

      setDeliveries(response.data);
      setFilteredDeliveries(response.data);
    } catch (err) {
      console.error("Error fetching deliveries:", err);
      setError("Failed to load deliveries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh deliveries
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  };

  // Navigate to delivery details
  const handleViewDelivery = (delivery) => {
    navigate(`/driver/deliveries/${delivery.id}`);
  };

  // Calculate stats
  const stats = {
    total: deliveries.length,
    active: deliveries.filter((d) => d.status === "assigned" || d.status === "in_transit").length,
    delivered: deliveries.filter((d) => d.status === "delivered").length,
  };

  return (
    <Layout title="My Deliveries">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600">
            {stats.total} total • {stats.active} active • {stats.delivered} delivered
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshIcon spinning={refreshing} />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          Refresh
        </Button>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search by tracking number or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm outline-none transition-all"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium outline-none cursor-pointer bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="assigned">Assigned</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {/* Results Counter */}
      {filteredDeliveries.length > 0 && (
        <p className="text-sm text-gray-600 mb-4">
          Showing {filteredDeliveries.length} {filteredDeliveries.length === 1 ? "delivery" : "deliveries"}
        </p>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Loading deliveries...</p>
          </div>
        </div>
      ) : filteredDeliveries.length === 0 ? (
        // Empty State
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-2xl text-gray-400 mb-4">
            <PackageIcon />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {searchQuery || statusFilter !== "all"
              ? "No deliveries match your filters"
              : "No deliveries assigned yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "New deliveries will appear here when they're assigned to you"}
          </p>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        // Deliveries Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onClick={handleViewDelivery}
            />
          ))}
        </div>
      )}

      {/* Help Section */}
      {deliveries.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            💡 Quick Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Click on any delivery to see full details and update status</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Keep your location sharing ON for accurate tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Update delivery status as you progress through each step</span>
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

export default MyDeliveries;