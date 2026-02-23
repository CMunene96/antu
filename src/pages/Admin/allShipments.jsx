// src/pages/admin/AllShipments.jsx
// Admin page to view all shipments across all customers

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/common/Layout";
import ShipmentList from "../../components/shipments/ShipmentList";
import ErrorMessage from "../../components/common/ErrorMessage";
import Button from "../../components/common/Button";
import api from "../../services/api";

/**
 * All Shipments Page (Admin)
 *
 * Features:
 * - View ALL shipments from all customers
 * - Advanced filters (status, customer, driver, date range)
 * - Search by tracking number
 * - Export to CSV
 * - View shipment details
 * - Assign driver to shipment
 * - Stats counter
 */

function AllShipments() {
  const navigate = useNavigate();

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchShipments();
  }, []);

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

  const handleTrackShipment = (shipment) => {
    navigate(`/admin/shipments/${shipment.id}`);
  };

  const stats = {
    total: shipments.length,
    pending: shipments.filter(s => s.status === "pending").length,
    inTransit: shipments.filter(s => s.status === "in_transit").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
  };

  return (
    <Layout title="All Shipments">
      
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600">
          {stats.total} total • {stats.inTransit} in transit • {stats.delivered} delivered
        </p>
        <Button variant="outline" onClick={fetchShipments}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage type="error" message={error} dismissible onDismiss={() => setError("")} />
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500 mb-1">In Transit</p>
          <p className="text-2xl font-bold text-amber-600">{stats.inTransit}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500 mb-1">Delivered</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.delivered}</p>
        </div>
      </div>

      <ShipmentList
        shipments={shipments}
        onTrack={handleTrackShipment}
        loading={loading}
        showFilters={true}
        emptyMessage="No shipments in the system yet."
      />
    </Layout>
  );
}

export default AllShipments;