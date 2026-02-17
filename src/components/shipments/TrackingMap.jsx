// src/components/shipments/TrackingMap.jsx
// Real-time shipment tracking map using Leaflet + react-leaflet.

/**
 * TrackingMap Component
 *  
 *
 * PROPS:
 *  trackingData   object  – data from GET /tracking/shipment/{id}/route
 *  height         string  – CSS height of the map (default "420px")
 *  autoRefresh    bool    – re-fetches location every 30 s
 *  onRefresh      func    – called on every auto-refresh tick (fetch fresh data here)
 *  showControls   bool    – render the stats panel + timeline below the map
 *
 * trackingData SHAPE (matches your backend response exactly):
 *  {
 *    shipment_id, tracking_number, status,
 *    origin:           { lat, lng, address },
 *    destination:      { lat, lng, address },
 *    route:            [{ lat, lng, timestamp, speed }, ...],
 *    current_location: { lat, lng, timestamp, speed } | null,
 *    // optional timestamps (pass through from GET /shipments/{id}):
 *    created_at, assigned_at, picked_up_at, delivered_at
 *  }
 *
 * USAGE (in TrackShipment page):
 *
 *  const [trackingData, setTrackingData] = useState(null);
 *
 *  useEffect(() => {
 *    async function load() {
 *      const data = await trackingService.getRoute(shipmentId);
 *      setTrackingData(data);
 *    }
 *    load();
 *  }, [shipmentId]);
 *
 *  <TrackingMap
 *    trackingData={trackingData}
 *    autoRefresh
 *    onRefresh={load}
 *    height="500px"
 *  />
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Fix Leaflet marker icons in Vite/Webpack ─────────────────────────────────
// Leaflet's bundled icon paths break in modern bundlers.
// Call this once after importing L.
function fixLeafletIcons(L) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  pending:    { dot: "bg-amber-400",  text: "text-amber-600",  bg: "bg-amber-50"  },
  assigned:   { dot: "bg-blue-500",   text: "text-blue-600",   bg: "bg-blue-50"   },
  in_transit: { dot: "bg-indigo-500", text: "text-indigo-600", bg: "bg-indigo-50" },
  delivered:  { dot: "bg-emerald-500",text: "text-emerald-600",bg: "bg-emerald-50"},
  cancelled:  { dot: "bg-red-400",    text: "text-red-600",    bg: "bg-red-50"    },
};

function fmtTime(str) {
  if (!str) return "—";
  return new Date(str).toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" });
}

function timeAgo(str) {
  if (!str) return null;
  const m = Math.floor((Date.now() - new Date(str)) / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Stat({ label, value, sub }) {
  return (
    <div className="text-center py-3 px-2 bg-white rounded-xl border border-gray-100 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900 leading-tight">{value || "—"}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function TimelineStep({ label, time, done, active }) {
  return (
    <div className="flex sm:flex-col items-center sm:items-start gap-2">
      <div className={`
        w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
        ${active ? "bg-indigo-500 text-white shadow shadow-indigo-200 animate-pulse"
          : done  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-400"
        }
      `}>
        {done ? "✓" : active ? "→" : "·"}
      </div>
      <div>
        <p className={`text-xs font-semibold
          ${active ? "text-indigo-600" : done ? "text-emerald-600" : "text-gray-400"}`}>
          {label}
        </p>
        {time && <p className="text-[10px] text-gray-400 mt-0.5">{fmtTime(time)}</p>}
      </div>
    </div>
  );
}

// Dark grid map placeholder shown when there's no data yet
function MapPlaceholder({ message }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl"
      style={{
        backgroundImage:
          "linear-gradient(rgba(99,102,241,.07) 1px,transparent 1px)," +
          "linear-gradient(90deg,rgba(99,102,241,.07) 1px,transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor"
          strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </div>
      <p className="text-slate-300 text-sm font-semibold">
        {message || "No tracking data yet"}
      </p>
      <p className="text-slate-600 text-xs mt-1">Updates as driver shares location</p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function TrackingMap({
  trackingData,
  height = "420px",
  autoRefresh = false,
  onRefresh,
  showControls = true,
}) {
  const mapDivRef   = useRef(null);   // DOM node for Leaflet
  const leafletMap  = useRef(null);   // Leaflet map instance
  const [ticker, setTicker] = useState(0); // seconds since last refresh
  const lastRefreshRef = useRef(new Date());

  // ── Tick counter (shows "updated 12s ago") ─────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTicker(Math.floor((Date.now() - lastRefreshRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Auto-refresh every 30 s ────────────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;
    const id = setInterval(() => {
      onRefresh();
      lastRefreshRef.current = new Date();
    }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, onRefresh]);

  // ── Build / rebuild Leaflet map when trackingData changes ──────────────────
  const buildMap = useCallback(async () => {
    if (!mapDivRef.current || !trackingData) return;

    // Dynamic import so Leaflet doesn't SSR-crash (works with Vite & Next.js)
    const L = (await import("leaflet")).default;
    await import("leaflet/dist/leaflet.css");
    fixLeafletIcons(L);

    const { origin, destination, route, current_location } = trackingData;
    if (!origin?.lat || !destination?.lat) return;

    // Destroy old map before reinit
    if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }

    const map = L.map(mapDivRef.current, {
      center:          [origin.lat, origin.lng],
      zoom:            13,
      zoomControl:     true,
      scrollWheelZoom: true,
    });
    leafletMap.current = map;

    // OpenStreetMap tile layer — free, no API key needed
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // ── Helper: custom div icon factory ───────────────────────────────────────
    const pinIcon = (color, label) => L.divIcon({
      className: "",
      html: `
        <div style="
          width:36px;height:36px;border-radius:50% 50% 50% 4px;
          background:${color};border:3px solid white;
          box-shadow:0 2px 10px rgba(0,0,0,.25);
          display:flex;align-items:center;justify-content:center;
          transform:rotate(-45deg);
        ">
          <span style="transform:rotate(45deg);font-size:13px;line-height:1">${label}</span>
        </div>`,
      iconSize: [36, 36], iconAnchor: [18, 32],
    });

    // ── Origin marker ─────────────────────────────────────────────────────────
    L.marker([origin.lat, origin.lng], { icon: pinIcon("#10b981", "🟢") })
      .addTo(map)
      .bindPopup(`
        <b style="font-size:.75rem;color:#10b981">PICKUP</b><br>
        <span style="font-size:.8rem">${origin.address}</span>
      `);

    // ── Destination marker ────────────────────────────────────────────────────
    L.marker([destination.lat, destination.lng], { icon: pinIcon("#ef4444", "📍") })
      .addTo(map)
      .bindPopup(`
        <b style="font-size:.75rem;color:#ef4444">DELIVERY</b><br>
        <span style="font-size:.8rem">${destination.address}</span>
      `);

    // ── Dashed grey line: direct route ────────────────────────────────────────
    L.polyline([[origin.lat, origin.lng], [destination.lat, destination.lng]], {
      color: "#94a3b8", weight: 2, dashArray: "6 6", opacity: 0.5,
    }).addTo(map);

    // ── Solid blue polyline: actual GPS route taken ───────────────────────────
    if (route?.length >= 2) {
      L.polyline(route.map(p => [p.lat, p.lng]), {
        color: "#3b82f6", weight: 4, opacity: 0.9, lineCap: "round",
      }).addTo(map);
    }

    // ── Pulsing truck marker at current driver location ───────────────────────
    const currentPos =
      current_location ||
      (route?.length ? route[route.length - 1] : null);

    if (currentPos) {
      const truckIcon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:52px;height:52px">
            <div style="
              position:absolute;inset:0;border-radius:50%;
              background:rgba(99,102,241,.25);
              animation:truckPing 1.5s ease-in-out infinite;
            "></div>
            <div style="
              position:absolute;inset:8px;border-radius:50%;
              background:#6366f1;border:3px solid white;
              box-shadow:0 2px 14px rgba(99,102,241,.6);
              display:flex;align-items:center;justify-content:center;
            ">
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <path d="M3 8l1.5-4h13l1.5 4M3 8h18M3 8v7M21 8v7M5.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm13 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
              </svg>
            </div>
          </div>
          <style>
            @keyframes truckPing {
              0%,100%{transform:scale(1);opacity:.8}
              50%{transform:scale(1.5);opacity:0}
            }
          </style>`,
        iconSize: [52, 52], iconAnchor: [26, 26],
      });

      L.marker([currentPos.lat, currentPos.lng], { icon: truckIcon })
        .addTo(map)
        .bindPopup(`
          <b style="font-size:.75rem;color:#6366f1">DRIVER — LIVE</b><br>
          ${currentPos.speed ? `Speed: ${currentPos.speed.toFixed(0)} km/h<br>` : ""}
          <span style="font-size:.7rem;color:#9ca3af">
            ${currentPos.timestamp ? new Date(currentPos.timestamp).toLocaleTimeString() : ""}
          </span>
        `);
    }

    // ── Fit map to show everything ─────────────────────────────────────────────
    const allCoords = [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
      ...(route || []).map(p => [p.lat, p.lng]),
    ];
    map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] });

  }, [trackingData]);

  useEffect(() => {
    buildMap();
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, [buildMap]);

  // ── Derived values for controls panel ─────────────────────────────────────
  const { origin, destination, route, current_location, status } = trackingData || {};
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.pending;
  const lastSpeed   = current_location?.speed ?? route?.[route?.length - 1]?.speed;

  const timeline = [
    { label: "Created",  time: trackingData?.created_at,   done: !!trackingData?.created_at,   active: status === "pending"    },
    { label: "Assigned", time: trackingData?.assigned_at,  done: !!trackingData?.assigned_at,  active: status === "assigned"   },
    { label: "Transit",  time: trackingData?.picked_up_at, done: !!trackingData?.picked_up_at, active: status === "in_transit" },
    { label: "Delivered",time: trackingData?.delivered_at, done: !!trackingData?.delivered_at, active: false                   },
  ];

  return (
    <div className="space-y-4">

      {/* ── Map container ──────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-md"
        style={{ height }}>

        {trackingData
          ? <div ref={mapDivRef} style={{ height: "100%", width: "100%" }} />
          : <MapPlaceholder />
        }

        {/* Status badge overlay */}
        {status && (
          <div className={`
            absolute top-3 left-3 z-[1000]
            flex items-center gap-1.5 px-3 py-1.5 rounded-full
            ${statusStyle.bg} border border-white/80
            shadow-lg backdrop-blur-sm text-xs font-bold ${statusStyle.text}
          `}>
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}
              ${status === "in_transit" ? "animate-pulse" : ""}`} />
            {status === "in_transit" ? "Live Tracking" : status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </div>
        )}

        {/* Refresh button overlay */}
        {onRefresh && (
          <button
            onClick={() => { onRefresh(); lastRefreshRef.current = new Date(); }}
            className="absolute top-3 right-3 z-[1000]
              flex items-center gap-1.5 px-3 py-1.5 rounded-full
              bg-white border border-gray-200 shadow-md
              text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor"
              strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {ticker < 5 ? "Updated" : `${ticker}s ago`}
          </button>
        )}
      </div>

      {/* ── Controls panel ─────────────────────────────────────────────────── */}
      {showControls && trackingData && (
        <div className="space-y-3">

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat
              label="Distance"
              value={trackingData.estimated_distance_km
                ? `${trackingData.estimated_distance_km} km` : null}
            />
            <Stat
              label="GPS Points"
              value={route?.length ?? 0}
              sub={route?.length ? "recorded" : "none yet"}
            />
            <Stat
              label="Speed"
              value={lastSpeed ? `${lastSpeed.toFixed(0)} km/h` : null}
            />
            <Stat
              label="Last Ping"
              value={current_location?.timestamp
                ? timeAgo(current_location.timestamp) : null}
            />
          </div>

          {/* Delivery timeline */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
              Delivery Timeline
            </p>
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 sm:justify-between">
              {timeline.map((step, i) => (
                <div key={i} className="flex sm:flex-col sm:flex-1 items-center sm:items-start gap-2">
                  <TimelineStep {...step} />
                  {i < timeline.length - 1 && (
                    <div className="hidden sm:block h-px w-full bg-gray-200 mt-3.5 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Route addresses */}
          {origin && destination && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex gap-3">
                {/* Vertical line connecting dots */}
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex-1 w-px bg-gray-200" />
                  <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pickup</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{origin.address}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Delivery</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{destination.address}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}