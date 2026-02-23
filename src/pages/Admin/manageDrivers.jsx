// src/pages/admin/ManageDrivers.jsx
// Admin page to view, manage, and assign vehicles to drivers

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/common/Layout";
import DriverList from "../../components/drivers/DriverList";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import api from "../../services/api";

/**
 * Manage Drivers Page
 *
 * Features:
 * - View all drivers with filters
 * - Search by name or license
 * - Filter by status (available, on_duty, off_duty)
 * - Filter by vehicle assignment
 * - Sort by performance
 * - Assign/change vehicle
 * - View driver details
 * - Update driver status
 * - Stats counter
 * - Add new driver button
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

// ─── Vehicle Assignment Modal ─────────────────────────────────────────────────

function VehicleAssignmentModal({ driver, vehicles, onAssign, onClose }) {
  const [selectedVehicle, setSelectedVehicle] = useState(driver?.vehicle_id || "");
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedVehicle) {
      alert("Please select a vehicle");
      return;
    }

    setAssigning(true);
    await onAssign(driver.id, selectedVehicle);
    setAssigning(false);
  };

  // Filter available vehicles (not assigned to other drivers)
  const availableVehicles = vehicles.filter(
    v => !v.driver_id || v.driver_id === driver?.vehicle_id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Assign Vehicle to {driver?.user?.full_name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Vehicle
          </label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            <option value="">-- Select a vehicle --</option>
            {availableVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.registration_number} ({vehicle.vehicle_type}) - {vehicle.capacity_kg}kg
              </option>
            ))}
          </select>
          
          {availableVehicles.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">
              No available vehicles. All vehicles are currently assigned.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            fullWidth
            onClick={onClose}
            disabled={assigning}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleAssign}
            loading={assigning}
            disabled={!selectedVehicle || availableVehicles.length === 0}
          >
            Assign Vehicle
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ManageDrivers Component ─────────────────────────────────────────────

function ManageDrivers() {
  const navigate = useNavigate();

  // State
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all drivers
      const driversResponse = await api.get("/drivers");
      setDrivers(driversResponse.data);

      // Fetch all vehicles
      const vehiclesResponse = await api.get("/vehicles");
      setVehicles(vehiclesResponse.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load drivers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // View driver details
  const handleViewDetails = (driver) => {
    navigate(`/admin/drivers/${driver.id}`);
  };

  // Assign vehicle
  const handleAssignVehicle = (driver) => {
    setSelectedDriver(driver);
    setShowAssignModal(true);
  };

  // Perform vehicle assignment
  const performAssignment = async (driverId, vehicleId) => {
    try {
      await api.put(`/drivers/${driverId}/assign-vehicle`, {
        vehicle_id: vehicleId
      });

      // Refresh data
      await fetchData();
      setShowAssignModal(false);
      setSelectedDriver(null);
      alert("Vehicle assigned successfully!");
    } catch (err) {
      console.error("Error assigning vehicle:", err);
      setError("Failed to assign vehicle. Please try again.");
    }
  };

  // Update driver status
  const handleUpdateStatus = async (driver, newStatus) => {
    try {
      await api.put(`/drivers/${driver.id}/status`, { status: newStatus });
      
      // Refresh data
      await fetchData();
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update driver status. Please try again.");
    }
  };

  // Calculate stats
  const stats = {
    total: drivers.length,
    available: drivers.filter((d) => d.status === "available").length,
    onDuty: drivers.filter((d) => d.status === "on_duty").length,
    withVehicle: drivers.filter((d) => d.vehicle_id).length,
  };

  return (
    <Layout title="Manage Drivers">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600">
            {stats.total} total • {stats.onDuty} on duty • {stats.withVehicle} with vehicles
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

          {/* Add New Driver Button */}
          <Button
            variant="primary"
            icon={<PlusIcon />}
            onClick={() => navigate("/admin/drivers/new")}
          >
            Add Driver
          </Button>
        </div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Drivers</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Available</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">On Duty</p>
          <p className="text-2xl font-bold text-blue-600">{stats.onDuty}</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">With Vehicles</p>
          <p className="text-2xl font-bold text-purple-600">{stats.withVehicle}</p>
        </div>
      </div>

      {/* Driver List */}
      <DriverList
        drivers={drivers}
        onViewDetails={handleViewDetails}
        onAssignVehicle={handleAssignVehicle}
        onUpdateStatus={handleUpdateStatus}
        loading={loading}
        emptyMessage="No drivers registered yet. Add your first driver!"
        showFilters={true}
        isAdmin={true}
      />

      {/* Vehicle Assignment Modal */}
      {showAssignModal && selectedDriver && (
        <VehicleAssignmentModal
          driver={selectedDriver}
          vehicles={vehicles}
          onAssign={performAssignment}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedDriver(null);
          }}
        />
      )}
    </Layout>
  );
}

export default ManageDrivers;