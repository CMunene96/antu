// src/pages/auth/Register.jsx
// Registration page with role selection, validation, and error handling

import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";

/**
 * Register Page
 *
 * Features:
 * - Multi-field registration form
 * - Role selection (customer/driver)
 * - Real-time form validation
 * - Password strength indicator
 * - Password confirmation
 * - Phone number validation
 * - Error handling
 * - Loading state
 * - Auto-login after registration
 * - Responsive design
 *
 * Fields:
 * - Full Name
 * - Email
 * - Phone Number
 * - Role (customer/driver)
 * - Password
 * - Confirm Password
 */

// ─── Icons ────────────────────────────────────────────────────────────────────

function TruckIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm8 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 8l1.5-4h13l1.5 4M3 8h18M3 8v6m18-6v6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Role Options ─────────────────────────────────────────────────────────────

const ROLES = [
  {
    value: "customer",
    label: "Customer",
    description: "I want to send shipments",
    icon: "📦",
  },
  {
    value: "driver",
    label: "Driver",
    description: "I want to deliver shipments",
    icon: "🚚",
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  // Kenya phone format: +254... or 07... or 01...
  const phoneRegex = /^(\+254|0)[17]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

function getPasswordStrength(password) {
  if (!password) return { strength: 0, label: "", color: "" };

  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  const levels = [
    { strength: 0, label: "", color: "" },
    { strength: 1, label: "Very Weak", color: "bg-red-500" },
    { strength: 2, label: "Weak", color: "bg-orange-500" },
    { strength: 3, label: "Fair", color: "bg-amber-500" },
    { strength: 4, label: "Good", color: "bg-emerald-500" },
    { strength: 5, label: "Strong", color: "bg-emerald-600" },
  ];

  return levels[strength];
}

function getErrorMessage(error) {
  if (error.response) {
    const status = error.response.status;
    const detail = error.response.data?.detail;

    if (status === 400 && detail?.includes("already registered")) {
      return "This email is already registered. Please login instead.";
    } else if (status === 422) {
      return "Invalid input. Please check all fields.";
    } else if (detail) {
      return detail;
    }
    return "Registration failed. Please try again.";
  } else if (error.request) {
    return "Cannot connect to server. Please check your internet connection.";
  } else {
    return "An unexpected error occurred. Please try again.";
  }
}

// ─── Main Register Component ──────────────────────────────────────────────────

function Register() {
  const navigate = useNavigate();
  const { register: registerUser, user } = useContext(AuthContext);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "customer",
    password: "",
    confirmPassword: "",
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength
  const passwordStrength = getPasswordStrength(formData.password);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (apiError) {
      setApiError("");
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Full name
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (formData.full_name.trim().length < 3) {
      newErrors.full_name = "Full name must be at least 3 characters";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid Kenyan phone number (e.g., +254722000000)";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    // Validate
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Attempt registration
      await registerUser({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\s/g, ""),
        role: formData.role,
        password: formData.password,
      });

      // Redirect to appropriate dashboard
      const routes = {
        customer: "/customer/dashboard",
        driver: "/driver/dashboard",
      };

      navigate(routes[formData.role] || "/");
    } catch (error) {
      console.error("Registration error:", error);
      setApiError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 py-12">
      <div className="w-full max-w-lg">
        
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl text-white mb-4 shadow-lg">
            <TruckIcon />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join Antu Logistics today
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          
          {/* API Error */}
          {apiError && (
            <div className="mb-6">
              <ErrorMessage
                type="error"
                message={apiError}
                dismissible
                onDismiss={() => setApiError("")}
              />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserIcon />
                </div>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  autoComplete="name"
                  autoFocus
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-lg border
                    ${errors.full_name ? "border-red-300" : "border-gray-300"}
                    focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all
                  `}
                  placeholder="John Doe"
                />
              </div>
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <EmailIcon />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-lg border
                    ${errors.email ? "border-red-300" : "border-gray-300"}
                    focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all
                  `}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <PhoneIcon />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-lg border
                    ${errors.phone ? "border-red-300" : "border-gray-300"}
                    focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all
                  `}
                  placeholder="+254722000000"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={`
                      relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
                      transition-all duration-200
                      ${
                        formData.role === role.value
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-3xl mb-2">{role.icon}</span>
                    <span className="text-sm font-semibold text-gray-900">{role.label}</span>
                    <span className="text-xs text-gray-500 text-center mt-1">{role.description}</span>
                    
                    {formData.role === role.value && (
                      <div className="absolute top-2 right-2">
                        <CheckCircleIcon />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={`
                    w-full pl-10 pr-12 py-3 rounded-lg border
                    ${errors.password ? "border-red-300" : "border-gray-300"}
                    focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <LockIcon />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={`
                    w-full pl-10 pr-12 py-3 rounded-lg border
                    ${errors.confirmPassword ? "border-red-300" : "border-gray-300"}
                    focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
              
              {/* Password Match Indicator */}
              {formData.password && formData.confirmPassword && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircleIcon />
                      <span className="text-emerald-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon />
                      <span className="text-gray-500">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link to="/login">
            <Button variant="outline" fullWidth>
              Sign In Instead
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By creating an account, you agree to our{" "}
          <Link to="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;