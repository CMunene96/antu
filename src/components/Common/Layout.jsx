// src/components/common/Layout.jsx
// Master layout wrapper — wraps every authenticated page
// Combines Navbar + Sidebar + main content area

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

/**
 * Layout Component
 *
 * Wrap every protected page with this component.
 * It handles the sidebar open/close state for you.
 *
 * Usage:
 * function CustomerDashboard() {
 *   return (
 *     <Layout>
 *       <h1>Welcome!</h1>
 *       <p>Your shipments here...</p>
 *     </Layout>
 *   );
 * }
 *
 * Props:
 * - children: page content
 * - title:    optional page title shown in breadcrumb area
 */

function Layout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Fixed top navbar */}
      <Navbar onMenuToggle={() => setSidebarOpen(true)} />

      {/* Sidebar drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content — offset from navbar height (64px = h-16) */}
      {/* On large screens, offset from sidebar width (256px = w-64) */}
      <main className="
        pt-16
        lg:pl-64
        min-h-screen
      ">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

          {/* Optional page title */}
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <div className="mt-1 h-1 w-12 bg-blue-600 rounded-full" />
            </div>
          )}

          {/* Page content */}
          {children}

        </div>
      </main>
    </div>
  );
}

export default Layout;