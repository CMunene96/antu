// src/components/drivers/DriverList.jsx
// List of drivers with filters, search, sorting, and pagination

import { useState, useMemo } from "react";
import DriverCard from "./DriverCard";

/**
 * DriverList Component
 *
 * Displays a filterable, searchable, sortable list of drivers with pagination.
 *
 * Props:
 * - drivers:        array — list of driver objects
 * - onViewDetails:  function — called when view details clicked
 * - onAssignVehicle: function — called when assign vehicle clicked
 * - onUpdateStatus: function — called when status changed
 * - loading:        bool — show loading state
 * - emptyMessage:   string — message when no drivers found
 * - compact:        bool — use compact cards (default: false)
 * - showFilters:    bool — show filter controls (default: true)
 * - isAdmin:        bool — show admin controls (default: false)
 *
 * Usage:
 * <DriverList
 *   drivers={allDrivers}
 *   onViewDetails={(driver) => navigate(`/drivers/${driver.id}`)}
 *   onAssignVehicle={(driver) => openVehicleModal(driver)}
 *   loading={isLoading}
 *   isAdmin={true}
 * />
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function EmptyDriverIcon() {
  return (
    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function DriverCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <EmptyDriverIcon />
      <p className="mt-4 text-gray-500 text-center max-w-sm">
        {message || "No drivers found"}
      </p>
    </div>
  );
}

// ─── Main DriverList Component ────────────────────────────────────────────────

function DriverList({
  drivers = [],
  onViewDetails,
  onAssignVehicle,
  onUpdateStatus,
  loading = false,
  emptyMessage,
  compact = false,
  showFilters = true,
  isAdmin = false,
}) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all"); // all | assigned | unassigned
  const [sortBy, setSortBy] = useState("name"); // name | rating | deliveries
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = compact ? 12 : 6;

  // Filter, Search & Sort Logic
  const processedDrivers = useMemo(() => {
    let result = [...drivers];

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }

    // Filter by vehicle assignment
    if (vehicleFilter === "assigned") {
      result = result.filter((d) => d.vehicle_id !== null);
    } else if (vehicleFilter === "unassigned") {
      result = result.filter((d) => d.vehicle_id === null);
    }

    // Search by name or license
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.user?.full_name?.toLowerCase().includes(query) ||
          d.license_number?.toLowerCase().includes(query) ||
          d.vehicle?.registration_number?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.user?.full_name || "").localeCompare(b.user?.full_name || "");
        
        case "rating": {
          const rateA = a.total_deliveries > 0 ? (a.completed_deliveries / a.total_deliveries) * 100 : 0;
          const rateB = b.total_deliveries > 0 ? (b.completed_deliveries / b.total_deliveries) * 100 : 0;
          return rateB - rateA; // Descending
        }
        
        case "deliveries":
          return (b.completed_deliveries || 0) - (a.completed_deliveries || 0); // Descending
        
        default:
          return 0;
      }
    });

    return result;
  }, [drivers, statusFilter, vehicleFilter, searchQuery, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(processedDrivers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDrivers = processedDrivers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  // Loading State
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <DriverCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Filters & Search */}
      {showFilters && (
        <div className="space-y-3">
          
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search by name, license, or vehicle..."
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery)(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg
                border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                text-sm outline-none transition-all
              "
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            
            <div className="flex items-center gap-2">
              <FilterIcon />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value)}
              className="
                px-3 py-2 rounded-lg border border-gray-300
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                text-sm font-medium outline-none cursor-pointer
                bg-white
              "
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="on_duty">On Duty</option>
              <option value="off_duty">Off Duty</option>
            </select>

            {/* Vehicle Filter */}
            <select
              value={vehicleFilter}
              onChange={(e) => handleFilterChange(setVehicleFilter)(e.target.value)}
              className="
                px-3 py-2 rounded-lg border border-gray-300
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                text-sm font-medium outline-none cursor-pointer
                bg-white
              "
            >
              <option value="all">All Drivers</option>
              <option value="assigned">With Vehicle</option>
              <option value="unassigned">No Vehicle</option>
            </select>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 ml-auto">
              <SortIcon />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="
                  px-3 py-2 rounded-lg border border-gray-300
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                  text-sm font-medium outline-none cursor-pointer
                  bg-white
                "
              >
                <option value="name">Name (A-Z)</option>
                <option value="rating">Highest Rating</option>
                <option value="deliveries">Most Deliveries</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      {processedDrivers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {startIndex + 1}–{Math.min(endIndex, processedDrivers.length)} of{" "}
            {processedDrivers.length} driver{processedDrivers.length !== 1 ? "s" : ""}
          </span>
          {(searchQuery || statusFilter !== "all" || vehicleFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setVehicleFilter("all");
                setCurrentPage(1);
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Driver Cards */}
      {paginatedDrivers.length === 0 ? (
        <EmptyState
          message={
            searchQuery || statusFilter !== "all" || vehicleFilter !== "all"
              ? "No drivers match your filters"
              : emptyMessage
          }
        />
      ) : (
        <div className={`grid gap-4 ${compact ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {paginatedDrivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onViewDetails={onViewDetails}
              onAssignVehicle={onAssignVehicle}
              onUpdateStatus={onUpdateStatus}
              compact={compact}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="
              p-2 rounded-lg border border-gray-300
              hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <ChevronLeftIcon />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`
                      min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium
                      transition-colors
                      ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    {page}
                  </button>
                );
              }

              // Show ellipsis
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 text-gray-400">
                    …
                  </span>
                );
              }

              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="
              p-2 rounded-lg border border-gray-300
              hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </div>
  );
}

export default DriverList;