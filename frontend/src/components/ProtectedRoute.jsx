import { Navigate, Outlet } from 'react-router-dom';
import { hasPermission } from '../utils/permissionUtils';

const ProtectedRoute = ({ allowedRoles, module, action }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/access-denied" replace />;
  }

  // Support for granular permissions
  if (module && action && !hasPermission(module, action)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
