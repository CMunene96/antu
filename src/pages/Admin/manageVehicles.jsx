// src/pages/admin/ManageVehicles.jsx
// Admin page to manage vehicles (view, add, edit, delete, assign)

import { useState, useEffect } from "react";
import Layout from "../../components/common/Layout";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import api from "../../services/api";

/**
 * Manage Vehicles Page
 *
 * Features:
 * - View all vehicles in grid/list
 * - Search by registration number
 * - Filter by type and status
 * - Add new vehicle
 * - Edit vehicle details
 * - Delete vehicle
 * - View assigned driver
 * - Stats counter
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

// ─── Vehicle Card Component ───────────────────────────────────────────────────

function VehicleCard({ vehicle, onEdit, onDelete }) {
  const typeIcons = {
    motorcycle: "🏍️",
    pickup: "🚙",
    van: "🚐",
    truck: "🚚",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
            {typeIcons[vehicle.vehicle_type] || "🚗"}
          </div>
          <div>
            <p className="font-bold text-gray-900">{vehicle.registration_number}</p>
            <p className="text-xs text-gray-500 capitalize">{vehicle.vehicle_type}</p>
          </div>
        </div>

        {vehicle.driver ? (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
            Assigned
          </span>
        ) : (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            Available
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Capacity</span>
          <span className="font-semibold text-gray-900">{vehicle.capacity_kg} kg</span>
        </div>

        {vehicle.driver && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Driver</span>
            <span className="font-semibold text-gray-900">{vehicle.driver.user?.full_name}</span>
          </div>
        )}

        {vehicle.last_maintenance && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Last Maintenance</span>
            <span className="font-semibold text-gray-900">
              {new Date(vehicle.last_maintenance).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          icon={<EditIcon />}
          onClick={() => onEdit(vehicle)}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          fullWidth
          icon={<DeleteIcon />}
          onClick={() => onDelete(vehicle)}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

// ─── Add/Edit Vehicle Modal ───────────────────────────────────────────────────

function VehicleFormModal({ vehicle, onSave, onClose }) {
  const [formData, setFormData] = useState({
    registration_number: vehicle?.registration_number || "",
    vehicle_type: vehicle?.vehicle_type || "van",
    capacity_kg: vehicle?.capacity_kg || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {vehicle ? "Edit Vehicle" : "Add New Vehicle"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Registration Number *
            </label>
            <input
              type="text"
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              placeholder="KCA-123X"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Vehicle Type *
            </label>
            <select
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            >
              <option value="motorcycle">Motorcycle 🏍️</option>
              <option value="pickup">Pickup 🚙</option>
              <option value="van">Van 🚐</option>
              <option value="truck">Truck 🚚</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Capacity (kg) *
            </label>
            <input
              type="number"
              value={formData.capacity_kg}
              onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
              placeholder="1000"
              required
              min="1"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={saving}
            >
              {vehicle ? "Update" : "Add"} Vehicle
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main ManageVehicles Component ────────────────────────────────────────────

function ManageVehicles() {
  // State
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Fetch vehicles
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filter vehicles
  useEffect(() => {
    let filtered = [...vehicles];

    if (typeFilter !== "all") {
      filtered = filtered.filter((v) => v.vehicle_type === typeFilter);
    }

    if (statusFilter === "assigned") {
      filtered = filtered.filter((v) => v.driver_id);
    } else if (statusFilter === "available") {
      filtered = filtered.filter((v) => !v.driver_id);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((v) =>
        v.registration_number?.toLowerCase().includes(query)
      );
    }

    setFilteredVehicles(filtered);
  }, [vehicles, searchQuery, typeFilter, statusFilter]);

  const fetchVehicles = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/vehicles");
      setVehicles(response.data);
      setFilteredVehicles(response.data);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError("Failed to load vehicles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedVehicle(null);
    setShowFormModal(true);
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowFormModal(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedVehicle) {
        await api.put(`/vehicles/${selectedVehicle.id}`, formData);
      } else {
        await api.post("/vehicles", formData);
      }

      await fetchVehicles();
      setShowFormModal(false);
      setSelectedVehicle(null);
    } catch (err) {
      console.error("Error saving vehicle:", err);
      setError("Failed to save vehicle. Please try again.");
    }
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Delete ${vehicle.registration_number}?`)) return;

    try {
      await api.delete(`/vehicles/${vehicle.id}`);
      await fetchVehicles();
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      setError("Failed to delete vehicle. It may be assigned to a driver.");
    }
  };

  const stats = {
    total: vehicles.length,
    assigned: vehicles.filter((v) => v.driver_id).length,
    available: vehicles.filter((v) => !v.driver_id).length,
  };

  return (
    <Layout title="Manage Vehicles">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600">
          {stats.total} total • {stats.assigned} assigned • {stats.available} available
        </p>

        <Button
          variant="primary"
          icon={<PlusIcon />}
          onClick={handleAddNew}
        >
          Add Vehicle
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6">
          <ErrorMessage type="error" message={error} dismissible onDismiss={() => setError("")} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search by registration number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium outline-none bg-white"
        >
          <option value="all">All Types</option>
          <option value="motorcycle">Motorcycle</option>
          <option value="pickup">Pickup</option>
          <option value="van">Van</option>
          <option value="truck">Truck</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium outline-none bg-white"
        >
          <option value="all">All Status</option>
          <option value="assigned">Assigned</option>
          <option value="available">Available</option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading vehicles...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <TruckIcon />
          <p className="mt-4 text-gray-600">No vehicles found</p>
          <Button variant="primary" size="sm" onClick={handleAddNew} className="mt-4">
            Add Your First Vehicle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <VehicleFormModal
          vehicle={selectedVehicle}
          onSave={handleSave}
          onClose={() => {
            setShowFormModal(false);
            setSelectedVehicle(null);
          }}
        />
      )}
    </Layout>
  );
}

export default ManageVehicles;