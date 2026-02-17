// src/components/shipments/ShipmentList.jsx
// Filterable, searchable, paginated shipment list — grid OR compact-list view.

/**
 * PROPS:
 *  shipments       array    – shipment objects from your API
 *  role            string   – "customer" | "driver" | "admin"
 *  loading         bool     – show skeleton loader while fetching
 *  onView          func(s)  – navigate to shipment detail
 *  onAssign        func(s)  – (admin) open assign-driver modal
 *  onUpdateStatus  func(s)  – (driver) open status-update panel
 *  showFilters     bool     – render the filter bar (default: true)
 *  emptyMessage    string   – override the empty state text
 *
 * USAGE:
 *  <ShipmentList
 *    shipments={shipments}
 *    role="admin"
 *    loading={loading}
 *    onView={(s) => navigate(`/admin/shipments/${s.id}`)}
 *    onAssign={(s) => openAssignModal(s)}
 *  />
 */

import { useState, useMemo } from "react";
import ShipmentCard from "./ShipmentCard";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "all",        label: "All"        },
  { value: "pending",    label: "Pending"    },
  { value: "assigned",   label: "Assigned"   },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered",  label: "Delivered"  },
  { value: "cancelled",  label: "Cancelled"  },
];

const SORT_OPTIONS = [
  { value: "newest",    label: "Newest First"    },
  { value: "oldest",    label: "Oldest First"    },
  { value: "cost_high", label: "Cost: High → Low" },
  { value: "cost_low",  label: "Cost: Low → High" },
];

const PAGE_SIZE = 9; // cards per page

// ─── Skeleton loader card ─────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="h-1 bg-gray-200 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
        <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <div className="flex-1 h-9 bg-gray-100 rounded-xl animate-pulse" />
          <div className="flex-1 h-9 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message, hasFilters, onClear }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor"
          strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 17.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm8 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 8l1.5-4h13l1.5 4M3 8h18M3 8v6m18-6v6" />
        </svg>
      </div>
      <p className="text-base font-semibold text-gray-600 mb-1">
        {message || "No shipments found"}
      </p>
      <p className="text-sm text-gray-400 mb-5 max-w-xs">
        {hasFilters
          ? "Try adjusting your search or filters."
          : "Shipments you create will appear here."}
      </p>
      {hasFilters && (
        <button onClick={onClear}
          className="text-sm font-semibold text-blue-600 hover:underline">
          Clear all filters
        </button>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ShipmentList({
  shipments = [],
  role = "customer",
  loading = false,
  onView,
  onAssign,
  onUpdateStatus,
  showFilters = true,
  emptyMessage,
}) {
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState("all");
  const [sort, setSort]           = useState("newest");
  const [viewMode, setViewMode]   = useState("grid"); // "grid" | "list"
  const [page, setPage]           = useState(1);

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const processed = useMemo(() => {
    let items = [...shipments];

    // Text search — tracking number, addresses, recipient name
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(s =>
        s.tracking_number?.toLowerCase().includes(q) ||
        s.origin_address?.toLowerCase().includes(q) ||
        s.destination_address?.toLowerCase().includes(q) ||
        s.recipient_name?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (status !== "all") {
      items = items.filter(s => s.status === status);
    }

    // Sort
    items.sort((a, b) => {
      if (sort === "newest")    return new Date(b.created_at) - new Date(a.created_at);
      if (sort === "oldest")    return new Date(a.created_at) - new Date(b.created_at);
      if (sort === "cost_high") return (b.estimated_cost || 0) - (a.estimated_cost || 0);
      if (sort === "cost_low")  return (a.estimated_cost || 0) - (b.estimated_cost || 0);
      return 0;
    });

    return items;
  }, [shipments, search, status, sort]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const paginated  = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search.trim() !== "" || status !== "all";

  const clearFilters = () => { setSearch(""); setStatus("all"); setSort("newest"); setPage(1); };

  // Reset to page 1 on every filter change
  const changeStatus = v => { setStatus(v); setPage(1); };
  const changeSearch = v => { setSearch(v); setPage(1); };

  // ── Count per status (for filter pill badges) ──────────────────────────────
  const counts = useMemo(() => {
    const c = { all: shipments.length };
    shipments.forEach(s => { c[s.status] = (c[s.status] || 0) + 1; });
    return c;
  }, [shipments]);

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {showFilters && <div className="h-12 bg-gray-100 rounded-2xl animate-pulse" />}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">

          {/* Row 1: search + sort + view toggle */}
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Search input */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => changeSearch(e.target.value)}
                placeholder="Search tracking number, address, recipient…"
                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder:text-gray-400"
              />
              {search && (
                <button onClick={() => changeSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor"
                    strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="py-2 px-3 text-sm border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Grid / List toggle */}
            <div className="flex border border-gray-200 rounded-xl overflow-hidden shrink-0">
              {["grid", "list"].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={`${mode} view`}
                  className={`px-3 py-2 transition-colors
                    ${viewMode === mode ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                >
                  {mode === "grid" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <rect x="1" y="1" width="6" height="6" rx="1" />
                      <rect x="9" y="1" width="6" height="6" rx="1" />
                      <rect x="1" y="9" width="6" height="6" rx="1" />
                      <rect x="9" y="9" width="6" height="6" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor"
                      strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: status pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => changeStatus(f.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all
                  ${status === f.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {f.label}
                <span className={`ml-1.5 opacity-70`}>
                  {counts[f.value] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Results count + clear ────────────────────────────────────────────── */}
      {processed.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
          <span>
            Showing <strong className="text-gray-700">{paginated.length}</strong>{" "}
            of <strong className="text-gray-700">{processed.length}</strong> shipments
          </span>
          {hasFilters && (
            <button onClick={clearFilters}
              className="text-blue-600 hover:underline font-medium text-sm">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Grid view ───────────────────────────────────────────────────────── */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.length === 0
            ? <EmptyState message={emptyMessage} hasFilters={hasFilters} onClear={clearFilters} />
            : paginated.map(s => (
              <ShipmentCard
                key={s.id}
                shipment={s}
                role={role}
                onView={() => onView?.(s)}
                onAssign={() => onAssign?.(s)}
                onUpdateStatus={() => onUpdateStatus?.(s)}
              />
            ))
          }
        </div>
      )}

      {/* ── List / compact view ─────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-gray-200
            text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <div className="col-span-1" />
            <div className="col-span-3">Tracking #</div>
            <div className="col-span-4">Route</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Cost</div>
          </div>

          {paginated.length === 0
            ? <EmptyState message={emptyMessage} hasFilters={hasFilters} onClear={clearFilters} />
            : paginated.map(s => (
              <ShipmentCard
                key={s.id}
                shipment={s}
                role={role}
                compact
                onView={() => onView?.(s)}
                onAssign={() => onAssign?.(s)}
                onUpdateStatus={() => onUpdateStatus?.(s)}
              />
            ))
          }
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl
              disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 text-sm rounded-xl font-medium transition-colors
                ${page === i + 1
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl
              disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}