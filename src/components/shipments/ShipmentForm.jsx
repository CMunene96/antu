// src/components/shipments/ShipmentForm.jsx
// 3-step shipment creation form: Pickup → Delivery → Package details

/**
 * PROPS:
 *  onSubmit   func(formData)  – called with clean validated data; make the API call here
 *  onCancel   func            – called when user cancels
 *  loading    bool            – disables submit while API call is in-flight
 *
 * WHAT THE FORM COLLECTS (matches POST /shipments/ request body):
 *  origin_address, origin_latitude, origin_longitude
 *  destination_address, destination_latitude, destination_longitude
 *  recipient_name, recipient_phone
 *  package_description, weight_kg, volume_m3
 *
 * HOW TO USE IN A PAGE:
 *  import ShipmentForm from '../../components/shipments/ShipmentForm';
 *
 *  function CreateShipmentPage() {
 *    const [loading, setLoading] = useState(false);
 *    const navigate = useNavigate();
 *
 *    const handleSubmit = async (data) => {
 *      setLoading(true);
 *      try {
 *        await shipmentService.create(data); // calls POST /shipments/
 *        navigate('/customer/shipments');
 *      } catch (err) {
 *        console.error(err);
 *      } finally {
 *        setLoading(false);
 *      }
 *    };
 *
 *    return (
 *      <Layout title="New Shipment">
 *        <ShipmentForm onSubmit={handleSubmit} onCancel={() => navigate(-1)} loading={loading} />
 *      </Layout>
 *    );
 *  }
 *
 * MAP INTEGRATION NOTE:
 *  The MapPicker component below is a ready-to-connect placeholder.
 *  When you add react-leaflet, replace the placeholder div with a real
 *  <MapContainer> and capture the clicked LatLng in onPick(lat, lng).
 */

import { useState } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Validate each step; returns an object of { fieldName: errorMessage }
function validateStep(step, form) {
  const e = {};

  if (step === 1) {
    if (!form.origin_address.trim())
      e.origin_address = "Pickup address is required";
    if (!form.origin_latitude || !form.origin_longitude)
      e.origin_coords = "Select a pickup location on the map";
  }

  if (step === 2) {
    if (!form.destination_address.trim())
      e.destination_address = "Delivery address is required";
    if (!form.destination_latitude || !form.destination_longitude)
      e.destination_coords = "Select a delivery location on the map";
    if (!form.recipient_name.trim())
      e.recipient_name = "Recipient name is required";
    if (!form.recipient_phone.trim())
      e.recipient_phone = "Recipient phone is required";
    else if (!/^\+?[\d\s\-]{9,15}$/.test(form.recipient_phone))
      e.recipient_phone = "Enter a valid phone number";
  }

  if (step === 3) {
    if (!form.weight_kg || isNaN(form.weight_kg))
      e.weight_kg = "Weight is required";
    else if (parseFloat(form.weight_kg) <= 0)
      e.weight_kg = "Weight must be greater than 0";
    else if (parseFloat(form.weight_kg) > 10000)
      e.weight_kg = "Maximum weight is 10,000 kg";
  }

  return e;
}

// Mirror your backend cost calculation for instant client-side preview
function previewCost(distKm, weightKg) {
  if (!distKm || !weightKg) return null;
  const d = parseFloat(distKm);
  const w = parseFloat(weightKg);
  let distCost;
  if      (d <= 10) distCost = d * 50;
  else if (d <= 50) distCost = 500 + (d - 10) * 40;
  else              distCost = 500 + 1600 + (d - 50) * 30;
  const surcharge = w > 20 ? ((w - 20) / 10) * 20 : 0;
  return Math.round(200 + distCost + surcharge);
}

// Simple Haversine for client-side distance preview (same formula as geopy)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dL = (lat2 - lat1) * Math.PI / 180;
  const dN = (lon2 - lon1) * Math.PI / 180;
  const a  = Math.sin(dL / 2) ** 2 +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
             Math.sin(dN / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Small shared UI pieces ───────────────────────────────────────────────────

function StepDots({ current }) {
  const steps = ["Pickup", "Delivery", "Package"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const n    = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              text-xs font-bold transition-all duration-300
              ${active ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : done ? "bg-emerald-500 text-white"
                       : "bg-gray-100 text-gray-400"
              }
            `}>
              {done
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor"
                    strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                : n
              }
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${done ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Labelled form field wrapper with error display
function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// Styled text input
function Input({ value, onChange, placeholder, error, type = "text", ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        w-full px-3 py-2.5 text-sm rounded-xl border transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        ${error
          ? "border-red-300 bg-red-50"
          : "border-gray-200 bg-white hover:border-gray-300"
        }
      `}
      {...rest}
    />
  );
}

// Styled textarea
function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200
        hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500
        resize-none transition-colors"
    />
  );
}

/**
 * MapPicker — placeholder that accepts coordinate inputs.
 *
 * TO UPGRADE TO A REAL MAP:
 *  npm install leaflet react-leaflet
 *
 *  Replace the inner div with:
 *  <MapContainer center={[-1.286389, 36.817223]} zoom={13} style={{height:"192px"}}>
 *    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
 *    <LocationPicker onPick={onPick} />   ← custom hook that listens for map clicks
 *    {lat && lng && <Marker position={[lat, lng]} />}
 *  </MapContainer>
 */
function MapPicker({ lat, lng, onPick, label }) {
  const ready = lat && lng;
  return (
    <div className="space-y-2">
      {/* Map visual area */}
      <div
        className={`
          relative h-44 rounded-2xl border-2 border-dashed overflow-hidden
          flex flex-col items-center justify-center gap-2 cursor-pointer
          transition-colors group
          ${ready
            ? "border-blue-300 bg-blue-50"
            : "border-gray-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50"
          }
        `}
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,.15) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(148,163,184,.15) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        {ready ? (
          <div className="flex flex-col items-center gap-2 relative z-10">
            {/* Pin */}
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center
              justify-center shadow-lg shadow-blue-200">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <span className="font-mono text-xs bg-white px-3 py-1.5 rounded-lg shadow
              border border-gray-200 text-gray-700">
              {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
            </span>
            <button type="button" onClick={() => onPick("", "")}
              className="text-xs text-red-400 hover:underline">
              Clear pin
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 relative z-10 text-center px-4">
            <div className="w-11 h-11 bg-white rounded-xl border-2 border-gray-200
              flex items-center justify-center group-hover:border-blue-400 transition-colors">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
              Click to place {label} pin
            </p>
            <p className="text-xs text-gray-400">Or enter coordinates below</p>
          </div>
        )}
      </div>

      {/* Manual coordinate inputs — useful on desktop / testing */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number" step="0.000001" value={lat || ""}
          onChange={e => onPick(e.target.value, lng)}
          placeholder="Latitude (e.g. -1.2864)"
          className="px-3 py-2 text-xs border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number" step="0.000001" value={lng || ""}
          onChange={e => onPick(lat, e.target.value)}
          placeholder="Longitude (e.g. 36.8172)"
          className="px-3 py-2 text-xs border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const BLANK = {
  origin_address:        "",
  origin_latitude:       "",
  origin_longitude:      "",
  destination_address:   "",
  destination_latitude:  "",
  destination_longitude: "",
  recipient_name:        "",
  recipient_phone:       "",
  package_description:   "",
  weight_kg:             "",
  volume_m3:             "",
};

export default function ShipmentForm({ onSubmit, onCancel, loading = false }) {
  const [step,   setStep]   = useState(1);
  const [form,   setForm]   = useState(BLANK);
  const [errors, setErrors] = useState({});

  // Update one field and clear its error
  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const e = {...prev}; delete e[key]; return e; });
  };

  // Live estimates (client-side preview only — backend recalculates on submit)
  const distKm = (form.origin_latitude && form.destination_latitude)
    ? haversine(
        parseFloat(form.origin_latitude),  parseFloat(form.origin_longitude),
        parseFloat(form.destination_latitude), parseFloat(form.destination_longitude)
      ).toFixed(2)
    : null;

  const costKsh = distKm && form.weight_kg
    ? previewCost(distKm, form.weight_kg)
    : null;

  // Go to next step after validation
  const goNext = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const goBack = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validateStep(3, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    await onSubmit({
      ...form,
      weight_kg: parseFloat(form.weight_kg),
      volume_m3: form.volume_m3 ? parseFloat(form.volume_m3) : null,
    });
  };

  const TITLES = ["Pickup Details", "Delivery Details", "Package Details"];

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} noValidate>

        <StepDots current={step} />

        {/* Step heading */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{TITLES[step - 1]}</h2>
          <p className="text-sm text-gray-400 mt-1">Step {step} of 3</p>
        </div>

        {/* ── STEP 1 · Pickup ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <Field label="Pickup Address" required error={errors.origin_address}>
              <Input
                value={form.origin_address}
                onChange={v => set("origin_address", v)}
                placeholder="e.g. Tom Mboya Street, CBD, Nairobi"
                error={errors.origin_address}
              />
            </Field>

            <Field
              label="Pickup Location" required
              error={errors.origin_coords}
              hint="Place a pin or type GPS coordinates directly"
            >
              <MapPicker
                lat={form.origin_latitude} lng={form.origin_longitude}
                onPick={(lat, lng) => {
                  set("origin_latitude", lat);
                  set("origin_longitude", lng);
                }}
                label="pickup"
              />
            </Field>
          </div>
        )}

        {/* ── STEP 2 · Delivery ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <Field label="Delivery Address" required error={errors.destination_address}>
              <Input
                value={form.destination_address}
                onChange={v => set("destination_address", v)}
                placeholder="e.g. Westlands Road, Westlands, Nairobi"
                error={errors.destination_address}
              />
            </Field>

            <Field
              label="Delivery Location" required
              error={errors.destination_coords}
            >
              <MapPicker
                lat={form.destination_latitude} lng={form.destination_longitude}
                onPick={(lat, lng) => {
                  set("destination_latitude", lat);
                  set("destination_longitude", lng);
                }}
                label="delivery"
              />
            </Field>

            {/* Live distance preview */}
            {distKm && (
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50
                rounded-xl border border-blue-100 text-sm text-blue-700">
                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none"
                  stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Estimated distance: <strong>{distKm} km</strong>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Recipient Name" required error={errors.recipient_name}>
                <Input
                  value={form.recipient_name}
                  onChange={v => set("recipient_name", v)}
                  placeholder="Full name"
                  error={errors.recipient_name}
                />
              </Field>
              <Field label="Recipient Phone" required error={errors.recipient_phone}>
                <Input
                  value={form.recipient_phone}
                  onChange={v => set("recipient_phone", v)}
                  placeholder="+254 7XX XXX XXX"
                  type="tel"
                  error={errors.recipient_phone}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── STEP 3 · Package ────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <Field label="Package Description"
              hint="What are you sending? e.g. Electronics, Documents">
              <Textarea
                value={form.package_description}
                onChange={v => set("package_description", v)}
                placeholder="Brief description of contents…"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Weight (kg)" required error={errors.weight_kg}>
                <Input type="number" min="0.1" step="0.1"
                  value={form.weight_kg}
                  onChange={v => set("weight_kg", v)}
                  placeholder="e.g. 5.5"
                  error={errors.weight_kg}
                />
              </Field>
              <Field label="Volume (m³)" hint="Optional">
                <Input type="number" min="0" step="0.01"
                  value={form.volume_m3}
                  onChange={v => set("volume_m3", v)}
                  placeholder="e.g. 0.2"
                />
              </Field>
            </div>

            {/* Live cost estimate card */}
            {costKsh ? (
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-3">
                  Instant Estimate
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{distKm}</p>
                    <p className="text-blue-300 text-xs mt-0.5">km</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{form.weight_kg}</p>
                    <p className="text-blue-300 text-xs mt-0.5">kg</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Number(costKsh).toLocaleString()}</p>
                    <p className="text-blue-300 text-xs mt-0.5">KSH</p>
                  </div>
                </div>
                <p className="text-center text-blue-300 text-xs mt-4">
                  * Final cost confirmed after delivery
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-200
                bg-gray-50 p-4 text-center text-sm text-gray-400">
                Complete pickup & delivery locations + enter weight to see live cost estimate
              </div>
            )}
          </div>
        )}

        {/* ── Navigation buttons ───────────────────────────────────────────── */}
        <div className="flex gap-3 mt-8 pt-5 border-t border-gray-100">
          {step === 1 ? (
            <button type="button" onClick={onCancel}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-600
                border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          ) : (
            <button type="button" onClick={goBack}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-600
                border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              ← Back
            </button>
          )}

          {step < 3 ? (
            <button type="button" onClick={goNext}
              className="flex-1 py-2.5 text-sm font-semibold text-white
                bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
              Next →
            </button>
          ) : (
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white
                bg-emerald-600 rounded-xl hover:bg-emerald-700
                disabled:bg-gray-300 disabled:cursor-not-allowed
                transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating…
                </>
              ) : "✓ Create Shipment"}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}