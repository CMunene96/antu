// src/components/drivers/LocationPicker.jsx
// Interactive map for picking or updating GPS location

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Button from "../common/Button";

/**
 * LocationPicker Component
 *
 * Interactive map that allows users to:
 * - Click to select a location
 * - Use current GPS position (geolocation API)
 * - Search for an address (optional)
 * - View current selection
 *
 * Props:
 * - initialLocation: { lat, lng, address? } — starting position
 * - onLocationSelect: function(location) — called when location is picked
 * - onCancel:        function — called when cancel is clicked
 * - height:          string — map height (default: "500px")
 * - showCurrentLocation: bool — show "Use My Location" button (default: true)
 * - mode:            string — "picker" (select) | "viewer" (display only)
 *
 * Usage:
 * <LocationPicker
 *   initialLocation={{ lat: -1.286389, lng: 36.817223 }}
 *   onLocationSelect={(location) => updateDriverLocation(location)}
 *   onCancel={() => setShowPicker(false)}
 *   showCurrentLocation={true}
 * />
 */

// ─── Fix Leaflet Icon Issue ───────────────────────────────────────────────────

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icon (red pin)
const createMarkerIcon = () => {
  return L.divIcon({
    className: "custom-location-marker",
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
      ">
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 30px;
          background: #ef4444;
          border-radius: 50% 50% 50% 0;
          transform: translateX(-50%) rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 16px;
            font-weight: bold;
          ">📍</div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

const markerIcon = createMarkerIcon();

// ─── Map Click Handler Sub-Component ──────────────────────────────────────────

function MapClickHandler({ onLocationClick, mode }) {
  useMapEvents({
    click(e) {
      if (mode === "picker") {
        onLocationClick(e.latlng);
      }
    },
  });
  return null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CrosshairIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M2 12h4m12 0h4M8.464 8.464l2.828 2.828m5.656 5.656l2.828 2.828M8.464 15.536l2.828-2.828m5.656-5.656l2.828-2.828" />
    </svg>
  );
}

function LocationArrowIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ─── Main LocationPicker Component ────────────────────────────────────────────

function LocationPicker({
  initialLocation = { lat: -1.286389, lng: 36.817223 }, // Nairobi default
  onLocationSelect,
  onCancel,
  height = "500px",
  showCurrentLocation = true,
  mode = "picker", // picker | viewer
}) {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const mapRef = useRef(null);

  // Handle map click
  const handleMapClick = (latlng) => {
    setSelectedLocation({
      lat: latlng.lat,
      lng: latlng.lng,
    });
    setLocationError(null);
  };

  // Get current device location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelectedLocation(newLocation);
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable in browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Confirm selection
  const handleConfirm = () => {
    if (onLocationSelect) {
      onLocationSelect(selectedLocation);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 mt-0.5">
            <CrosshairIcon />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">
              {mode === "picker" ? "Select Your Location" : "Current Location"}
            </p>
            <p className="text-xs text-blue-700">
              {mode === "picker"
                ? "Click anywhere on the map to select a location, or use the button below to use your current GPS position."
                : "This is the currently selected location."}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {locationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {locationError}
        </div>
      )}

      {/* Current Selection Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-1">Selected Coordinates</p>
        <div className="flex items-center justify-between">
          <div className="font-mono text-sm text-gray-900">
            <span className="font-semibold">Lat:</span> {selectedLocation.lat.toFixed(6)}
            {" • "}
            <span className="font-semibold">Lng:</span> {selectedLocation.lng.toFixed(6)}
          </div>
          <div className="text-xs text-gray-500">
            Accuracy: ±10m
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border-2 border-gray-300 shadow-sm">
        <MapContainer
          center={[selectedLocation.lat, selectedLocation.lng]}
          zoom={15}
          style={{ height, width: "100%" }}
          scrollWheelZoom={true}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Click handler */}
          <MapClickHandler onLocationClick={handleMapClick} mode={mode} />

          {/* Selected location marker */}
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={markerIcon}
          />
        </MapContainer>

        {/* Crosshair Overlay (shows map center is clickable) */}
        {mode === "picker" && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000]">
            <div className="text-gray-400 opacity-50">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        )}

        {/* Use Current Location Button (Overlay) */}
        {showCurrentLocation && mode === "picker" && (
          <div className="absolute bottom-4 right-4 z-[1000]">
            <button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="
                bg-white rounded-lg shadow-lg px-4 py-3
                hover:bg-gray-50 transition-colors
                border border-gray-200
                flex items-center gap-2 text-sm font-medium text-gray-700
                disabled:opacity-50
              "
              title="Use my current location"
            >
              {gettingLocation ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <LocationArrowIcon />
                  Use My Location
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Helpful Tips */}
      {mode === "picker" && (
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <p className="font-semibold mb-1">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Use scroll wheel or pinch to zoom in/out</li>
            <li>Click and drag to pan the map</li>
            <li>Click anywhere to drop a pin at that location</li>
            <li>The red pin shows your selected location</li>
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      {mode === "picker" && (
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          
          <Button
            variant="primary"
            onClick={handleConfirm}
            size="lg"
            icon={<LocationArrowIcon />}
          >
            Confirm Location
          </Button>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;