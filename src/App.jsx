import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/login';
import Register from './pages/auth/Register';
import CustomerDashboard from './pages/Customer/Dashboard';
import DriverDashboard from './pages/driver/Dashboard';
import AdminDashboard from './pages/Admin/dashBoard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected customer routes */}
          <Route 
            path="/customer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected driver routes */}
          <Route 
            path="/driver/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected admin routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Add an unauthorized page */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;