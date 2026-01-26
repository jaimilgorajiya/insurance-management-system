import React, { useState } from 'react';
import { 
  ShieldLogo, DashboardIcon, UsersIcon, CustomersIcon, 
  PoliciesIcon, AgentsIcon, ClaimsIcon, DocumentsIcon, 
  NotificationsIcon, ReportsIcon, LogoutIcon, MenuIcon, CloseIcon
} from './LayoutIcons';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';
import { showSuccessAlert, showConfirmAction } from '../utils/swalUtils';
import Swal from 'sweetalert2';

const Sidebar = ({ collapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { label: 'Users & Roles', icon: <UsersIcon />, path: '/admin/users' },
    { label: 'Customers', icon: <CustomersIcon />, path: '/admin/customers' },
    { label: 'Policies', icon: <PoliciesIcon />, path: '/admin/policies' },
    { label: 'Agents', icon: <AgentsIcon />, path: '/admin/agents' },
    { label: 'Claims', icon: <ClaimsIcon />, path: '/admin/claims' },
    { label: 'Documents', icon: <DocumentsIcon />, path: '/admin/documents' },
    { label: 'Notifications', icon: <NotificationsIcon />, path: '/admin/notifications' },
    { label: 'Reports', icon: <ReportsIcon />, path: '/admin/reports' },
  ];

  const handleLogout = async () => {
    const isConfirmed = await showConfirmAction(
      'Sign Out',
      'Are you sure you want to log out?',
      'Yes, log out',
      '#ef4444'
    );

    if (isConfirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      navigate('/');
      showSuccessAlert('Logged out successfully');
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <ShieldLogo />
          <span className="brand-text">InsureCRM</span>
        </div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          {collapsed ? <MenuIcon /> : <CloseIcon />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span className="nav-text">{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogoutIcon />
          <span className="logout-text">Logout</span>
        </button>
      </div>
      
    </aside>
  );
};

export default Sidebar;
