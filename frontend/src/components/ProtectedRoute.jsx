import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    // Redirect to login if no token is found
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to access denied if role not allowed
    return <Navigate to="/access-denied" replace />;
  }

  // If token exists and role is allowed, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
