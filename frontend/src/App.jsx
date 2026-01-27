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
import { ClaimsPlaceholder, ReportsPlaceholder } from './pages/Placeholders';
import AccessDenied from './pages/AccessDenied';
import AgentCommission from './pages/AgentCommission';
import AgentPermissions from './pages/AgentPermissions';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Access Denied Route */}
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* Profile Route (Accessible to all authenticated users) */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'agent', 'customer']} />}>
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Protected Routes - Common for Admin and Agent */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'agent']} module="customers" action="view" />}>
          <Route path="/admin/customers" element={<Customers />} />
          <Route path="/admin/customers/:id" element={<CustomerDetails />} />
          <Route path="/admin/documents/customers/:customerId" element={<CustomerDocuments />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin', 'agent']} module="customers" action="create" />}>
          <Route path="/admin/customers/create" element={<CustomerOnboarding />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin', 'agent']} module="customers" action="edit" />}>
          <Route path="/admin/customers/edit/:id" element={<EditCustomer />} />
          <Route path="/admin/customers/:customerId/buy-policy" element={<BuyPolicy />} />
        </Route>

        {/* <Route element={<ProtectedRoute allowedRoles={['admin', 'agent']} />}>
          <Route path="/admin/claims" element={<ClaimsPlaceholder />} />
        </Route> */}

        <Route element={<ProtectedRoute allowedRoles={['admin', 'agent']} module="policies" action="view" />}>
          <Route path="/admin/policies" element={<Policies />} />
          <Route path="/admin/policies/:id" element={<PolicyDetails />} />
        </Route>

        {/* Admin Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/agents" element={<Agents />} />
          <Route path="/admin/agents/create" element={<EditAgent />} />
          <Route path="/admin/agents/edit/:id" element={<EditAgent />} />
          <Route path="/admin/agents/permissions" element={<AgentPermissions />} />
          <Route path="/admin/agents/:id" element={<AgentDetails />} />
          <Route path="/admin/policy-types" element={<PolicyTypes />} />
          <Route path="/admin/providers" element={<Providers />} />
          <Route path="/admin/documents" element={<Documents />} />
          <Route path="/admin/reports" element={<ReportsPlaceholder />} />
        </Route>

        {/* Agent Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/agent/commission" element={<AgentCommission />} />
        </Route>

        {/* Customer Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
