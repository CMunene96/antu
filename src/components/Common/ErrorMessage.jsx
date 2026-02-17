// src/components/common/ErrorMessage.jsx
// Flexible alert/message component for errors, warnings, success & info

import { useState } from "react";

/**
 * ErrorMessage Component
 *
 * Props:
 * - type:       "error" | "warning" | "success" | "info"
 * - title:      string (optional bold heading)
 * - message:    string | string[] (one message or list of messages)
 * - dismissible: true | false (shows ✕ close button)
 * - onDismiss:  callback when dismissed
 * - className:  extra CSS classes
 *
 * Usage:
 * <ErrorMessage type="error" message="Invalid email or password" />
 *
 * <ErrorMessage
 *   type="warning"
 *   title="Form errors:"
 *   message={["Email is required", "Password too short"]}
 *   dismissible
 * />
 *
 * <ErrorMessage type="success" message="Shipment created successfully!" dismissible />
 *
 * <ErrorMessage type="info" message="Driver location updates every 2 minutes." />
 */

// --- Icons ---

function ErrorIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// --- Config per type ---

const TYPE_CONFIG = {
  error: {
    icon: <ErrorIcon />,
    container: "bg-red-50 border border-red-200",
    title: "text-red-800",
    message: "text-red-700",
    button: "text-red-500 hover:bg-red-100",
    accent: "bg-red-500",
  },
  warning: {
    icon: <WarningIcon />,
    container: "bg-amber-50 border border-amber-200",
    title: "text-amber-800",
    message: "text-amber-700",
    button: "text-amber-500 hover:bg-amber-100",
    accent: "bg-amber-500",
  },
  success: {
    icon: <SuccessIcon />,
    container: "bg-emerald-50 border border-emerald-200",
    title: "text-emerald-800",
    message: "text-emerald-700",
    button: "text-emerald-500 hover:bg-emerald-100",
    accent: "bg-emerald-500",
  },
  info: {
    icon: <InfoIcon />,
    container: "bg-blue-50 border border-blue-200",
    title: "text-blue-800",
    message: "text-blue-700",
    button: "text-blue-500 hover:bg-blue-100",
    accent: "bg-blue-500",
  },
};

function ErrorMessage({
  type = "error",
  title,
  message,
  dismissible = false,
  onDismiss,
  className = "",
}) {
  const [visible, setVisible] = useState(true);

  if (!visible || !message) return null;

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.error;

  // Normalize message to array
  const messages = Array.isArray(message) ? message : [message];

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <div
      role="alert"
      className={`
        relative flex gap-3 rounded-lg px-4 py-3
        ${config.container}
        ${className}
      `}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${config.accent}`} />

      {/* Icon */}
      <span className={`mt-0.5 ${config.message}`}>{config.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        {title && (
          <p className={`font-semibold text-sm mb-1 ${config.title}`}>
            {title}
          </p>
        )}

        {/* Single message */}
        {messages.length === 1 && (
          <p className={`text-sm ${config.message}`}>{messages[0]}</p>
        )}

        {/* Multiple messages as list */}
        {messages.length > 1 && (
          <ul className={`text-sm space-y-1 list-disc list-inside ${config.message}`}>
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={`
            shrink-0 self-start p-1 rounded
            transition-colors duration-150
            ${config.button}
          `}
          aria-label="Dismiss"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;