// src/pages/customer/CreateShipment.jsx
// Create new shipment with form, location picker, and cost estimation

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/common/Layout";
import ShipmentForm from "../../components/shipments/ShipmentForm";
import LocationPicker from "../../components/drivers/LocationPicker";
import ErrorMessage from "../../components/common/ErrorMessage";
import api from "../../services/api";

/**
 * Create Shipment Page
 *
 * Features:
 * - Multi-step form for creating shipments
 * - Location picker for origin and destination
 * - Auto-calculate distance and cost
 * - Form validation
 * - Success/error handling
 * - Redirect to shipment list after creation
 */

function CreateShipment() {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState(null); // "origin" | "destination"
  const [formData, setFormData] = useState({
    origin_address: "",
    origin_latitude: "",
    origin_longitude: "",
    destination_address: "",
    destination_latitude: "",
    destination_longitude: "",
    recipient_name: "",
    recipient_phone: "",
    description: "",
    weight_kg: "",
    special_instructions: "",
  });

  // Handle location selection from map
  const handleLocationSelect = (location) => {
    if (locationPickerType === "origin") {
      setFormData((prev) => ({
        ...prev,
        origin_latitude: location.lat,
        origin_longitude: location.lng,
      }));
    } else if (locationPickerType === "destination") {
      setFormData((prev) => ({
        ...prev,
        destination_latitude: location.lat,
        destination_longitude: location.lng,
      }));
    }

    setShowLocationPicker(false);
    setLocationPickerType(null);
  };

  // Open location picker
  const openLocationPicker = (type) => {
    setLocationPickerType(type);
    setShowLocationPicker(true);
  };

  // Handle form submission
  const handleSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      // Create shipment
      const response = await api.post("/shipments", {
        origin_address: data.origin_address,
        origin_latitude: parseFloat(data.origin_latitude),
        origin_longitude: parseFloat(data.origin_longitude),
        destination_address: data.destination_address,
        destination_latitude: parseFloat(data.destination_latitude),
        destination_longitude: parseFloat(data.destination_longitude),
        recipient_name: data.recipient_name,
        recipient_phone: data.recipient_phone,
        description: data.description,
        weight_kg: parseFloat(data.weight_kg),
        special_instructions: data.special_instructions || null,
      });

      setSuccess(true);

      // Show success message briefly, then redirect
      setTimeout(() => {
        navigate("/customer/shipments");
      }, 2000);
    } catch (err) {
      console.error("Error creating shipment:", err);
      
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.status === 422) {
        setError("Invalid shipment data. Please check all fields.");
      } else {
        setError("Failed to create shipment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate("/customer/shipments");
  };

  return (
    <Layout title="Create New Shipment">
      
      {/* Success Message */}
      {success && (
        <div className="mb-6">
          <ErrorMessage
            type="success"
            message="Shipment created successfully! Redirecting..."
            dismissible={false}
          />
        </div>
      )}

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

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Creating a New Shipment
            </h3>
            <p className="text-sm text-blue-700">
              Fill in the details below to create your shipment. The cost will be automatically calculated based on distance and weight.
            </p>
          </div>
        </div>
      </div>

      {/* Shipment Form */}
      <ShipmentForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        onLocationPick={openLocationPicker}
      />

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {locationPickerType === "origin" ? "Select Pickup Location" : "Select Delivery Location"}
              </h2>
              <button
                onClick={() => {
                  setShowLocationPicker(false);
                  setLocationPickerType(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <LocationPicker
              initialLocation={
                locationPickerType === "origin"
                  ? {
                      lat: parseFloat(formData.origin_latitude) || -1.286389,
                      lng: parseFloat(formData.origin_longitude) || 36.817223,
                    }
                  : {
                      lat: parseFloat(formData.destination_latitude) || -1.286389,
                      lng: parseFloat(formData.destination_longitude) || 36.817223,
                    }
              }
              onLocationSelect={handleLocationSelect}
              onCancel={() => {
                setShowLocationPicker(false);
                setLocationPickerType(null);
              }}
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

export default CreateShipment;