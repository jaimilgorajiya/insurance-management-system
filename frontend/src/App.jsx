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
import UsersAndRoles from './pages/UsersAndRoles';
import PolicyTypes from './pages/PolicyTypes';
import Policies from './pages/Policies';
import PolicyDetails from './pages/PolicyDetails';
import Providers from './pages/Providers';
import Documents from './pages/Documents';
import CustomerDocuments from './pages/CustomerDocuments';
import BuyPolicy from './pages/BuyPolicy';
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
          {/* <Route path="/admin/users" element={<UsersAndRoles />} /> */}
          <Route path="/admin/customers" element={<Customers />} />
          <Route path="/admin/customers/create" element={<CustomerOnboarding />} />
          <Route path="/admin/customers/edit/:id" element={<EditCustomer />} />
          <Route path="/admin/customers/:id" element={<CustomerDetails />} />
          <Route path="/admin/customers/:customerId/buy-policy" element={<BuyPolicy />} />
          <Route path="/admin/agents" element={<Agents />} />
          <Route path="/admin/agents/create" element={<EditAgent />} />
          <Route path="/admin/agents/edit/:id" element={<EditAgent />} />
          <Route path="/admin/agents/:id" element={<AgentDetails />} />
          <Route path="/admin/policy-types" element={<PolicyTypes />} />
          <Route path="/admin/policies" element={<Policies />} />
          <Route path="/admin/providers" element={<Providers />} />
          <Route path="/admin/policies/:id" element={<PolicyDetails />} />
          <Route path="/admin/documents" element={<Documents />} />
          <Route path="/admin/documents/customers/:customerId" element={<CustomerDocuments />} />
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
