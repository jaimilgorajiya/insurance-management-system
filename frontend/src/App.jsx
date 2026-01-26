import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { AdminDashboard, AgentDashboard, CustomerDashboard } from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerOnboarding from './pages/CustomerOnboarding';
import CustomerDetails from './pages/CustomerDetails';
import EditCustomer from './pages/EditCustomer';
import Agents from './pages/Agents';
import EditAgent from './pages/EditAgent';
import AgentDetails from './pages/AgentDetails';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/customers" element={<Customers />} />
          <Route path="/admin/customers/create" element={<CustomerOnboarding />} />
          <Route path="/admin/customers/edit/:id" element={<EditCustomer />} />
          <Route path="/admin/customers/:id" element={<CustomerDetails />} />
          <Route path="/admin/agents" element={<Agents />} />
          <Route path="/admin/agents/create" element={<EditAgent />} />
          <Route path="/admin/agents/edit/:id" element={<EditAgent />} />
          <Route path="/admin/agents/:id" element={<AgentDetails />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
