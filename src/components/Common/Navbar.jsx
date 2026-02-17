// src/components/common/Navbar.jsx
// Top navigation bar — adapts to role: admin, customer, driver, logistics_company

import { useState, useContext, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

/**
 * Navbar Component
 *
 * Automatically adapts based on the logged-in user's role.
 * Shows relevant quick links and a user dropdown.
 *
 * Props:
 * - onMenuToggle: function — called when hamburger is clicked (to open Sidebar)
 *
 * Usage:
 * <Navbar onMenuToggle={() => setSidebarOpen(true)} />
 */

// --- Icons (inline SVG, no icon library needed) ---

function TruckIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

// --- Role badge config ---
const ROLE_BADGES = {
  admin:             { label: "Admin",    bg: "bg-red-100",     text: "text-red-700"     },
  customer:          { label: "Customer", bg: "bg-blue-100",    text: "text-blue-700"    },
  driver:            { label: "Driver",   bg: "bg-emerald-100", text: "text-emerald-700" },
  logistics_company: { label: "Company",  bg: "bg-purple-100",  text: "text-purple-700"  },
};

// --- Quick links per role ---
const QUICK_LINKS = {
  customer: [
    { label: "Dashboard",       to: "/customer/dashboard" },
    { label: "New Shipment",    to: "/customer/shipments/create" },
    { label: "Track Shipment",  to: "/customer/track" },
  ],
  driver: [
    { label: "Dashboard",   to: "/driver/dashboard" },
    { label: "Deliveries",  to: "/driver/deliveries" },
  ],
  admin: [
    { label: "Dashboard",   to: "/admin/dashboard" },
    { label: "Shipments",   to: "/admin/shipments" },
    { label: "Drivers",     to: "/admin/drivers" },
    { label: "Vehicles",    to: "/admin/vehicles" },
    { label: "Analytics",   to: "/admin/analytics" },
  ],
  logistics_company: [
    { label: "Dashboard",   to: "/company/dashboard" },
    { label: "Fleet",       to: "/company/fleet" },
  ],
};

function Navbar({ onMenuToggle }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const role = user?.role || "customer";
  const quickLinks = QUICK_LINKS[role] || [];
  const badge = ROLE_BADGES[role] || ROLE_BADGES.customer;

  // Get user initials for avatar
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <nav className="
      fixed top-0 left-0 right-0 z-50
      bg-white border-b border-gray-200
      shadow-sm
    ">
      <div className="px-4 h-16 flex items-center justify-between gap-4">

        {/* LEFT — Hamburger + Logo */}
        <div className="flex items-center gap-3">

          {/* Hamburger (mobile / opens sidebar) */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>

          {/* Logo */}
          <Link to={`/${role}/dashboard`} className="flex items-center gap-2 group">
            <div className="
              w-8 h-8 bg-blue-600 rounded-lg
              flex items-center justify-center
              text-white
              group-hover:bg-blue-700 transition-colors
            ">
              <TruckIcon />
            </div>
            <span className="hidden sm:block font-bold text-gray-900 text-lg tracking-tight">
              Antu <span className="text-blue-600">Logistics</span>
            </span>
          </Link>
        </div>

        {/* CENTRE — Quick nav links (hidden on small screens) */}
        <div className="hidden lg:flex items-center gap-1">
          {quickLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* RIGHT — Notifications + User dropdown */}
        <div className="flex items-center gap-2">

          {/* Notification bell */}
          <button className="
            relative p-2 rounded-lg
            text-gray-500 hover:bg-gray-100 hover:text-gray-700
            transition-colors
          ">
            <BellIcon />
            {/* Red dot — remove when no notifications */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="
                flex items-center gap-2 px-2 py-1.5 rounded-lg
                hover:bg-gray-100 transition-colors
              "
            >
              {/* Avatar */}
              <div className="
                w-8 h-8 rounded-full bg-blue-600
                flex items-center justify-center
                text-white text-xs font-bold
                shrink-0
              ">
                {initials}
              </div>

              {/* Name + role (hidden on mobile) */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {user?.full_name || "User"}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {user?.email}
                </p>
              </div>

              <ChevronDownIcon />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="
                absolute right-0 top-full mt-2
                w-56 bg-white rounded-xl shadow-lg
                border border-gray-200
                py-1 z-50
                animate-in fade-in slide-in-from-top-1 duration-150
              ">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>

                  {/* Role badge */}
                  <span className={`
                    inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold
                    ${badge.bg} ${badge.text}
                  `}>
                    {badge.label}
                  </span>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <UserIcon />
                    My Profile
                  </Link>

                  <hr className="my-1 border-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <LogoutIcon />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;