// src/components/common/Button.jsx
// Reusable button component with multiple variants, sizes, and states

import { useState } from "react";

/**
 * Button Component
 *
 * Props:
 * - variant: "primary" | "secondary" | "danger" | "ghost" | "outline"
 * - size:    "sm" | "md" | "lg"
 * - loading: true | false  (shows spinner)
 * - disabled: true | false
 * - icon:    JSX element (optional left icon)
 * - iconRight: JSX element (optional right icon)
 * - fullWidth: true | false
 * - onClick: function
 * - type: "button" | "submit" | "reset"
 * - children: button label text
 *
 * Usage:
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Create Shipment
 * </Button>
 *
 * <Button variant="danger" loading={isDeleting}>
 *   Delete Vehicle
 * </Button>
 *
 * <Button variant="outline" icon={<PlusIcon />}>
 *   Add Driver
 * </Button>
 */

// Spinner icon used during loading state
function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon = null,
  iconRight = null,
  fullWidth = false,
  onClick,
  type = "button",
  className = "",
}) {
  const [ripple, setRipple] = useState(null);

  // --- Style Maps ---

  const base = `
    relative inline-flex items-center justify-center gap-2
    font-semibold tracking-wide rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    select-none overflow-hidden
    cursor-pointer
  `;

  const variants = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700 active:bg-blue-800
      focus:ring-blue-500
      shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-emerald-600 text-white
      hover:bg-emerald-700 active:bg-emerald-800
      focus:ring-emerald-500
      shadow-sm hover:shadow-md
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700 active:bg-red-800
      focus:ring-red-500
      shadow-sm hover:shadow-md
    `,
    ghost: `
      bg-transparent text-gray-700
      hover:bg-gray-100 active:bg-gray-200
      focus:ring-gray-400
    `,
    outline: `
      bg-transparent text-blue-600
      border-2 border-blue-600
      hover:bg-blue-50 active:bg-blue-100
      focus:ring-blue-500
    `,
    warning: `
      bg-amber-500 text-white
      hover:bg-amber-600 active:bg-amber-700
      focus:ring-amber-400
      shadow-sm hover:shadow-md
    `,
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const disabledStyle =
    disabled || loading
      ? "opacity-50 cursor-not-allowed pointer-events-none"
      : "";

  const widthStyle = fullWidth ? "w-full" : "";

  // Ripple effect on click
  const handleClick = (e) => {
    if (disabled || loading) return;

    // Create ripple
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y });
    setTimeout(() => setRipple(null), 600);

    if (onClick) onClick(e);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        ${base}
        ${variants[variant] || variants.primary}
        ${sizes[size]}
        ${disabledStyle}
        ${widthStyle}
        ${className}
      `}
    >
      {/* Ripple Effect */}
      {ripple && (
        <span
          className="absolute rounded-full bg-white opacity-30 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      )}

      {/* Left Icon or Spinner */}
      {loading ? <SpinnerIcon /> : icon && <span className="shrink-0">{icon}</span>}

      {/* Label */}
      <span>{children}</span>

      {/* Right Icon */}
      {!loading && iconRight && (
        <span className="shrink-0">{iconRight}</span>
      )}
    </button>
  );
}

export default Button;