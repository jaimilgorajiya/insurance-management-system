import React, { useState, useEffect } from 'react';
import { syncPermissions, usePermission } from '../utils/permissionUtils';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

import { decodeToken, logoutUser } from '../utils/authUtils';

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { permissionsUpdated } = usePermission();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp) {
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = (decoded.exp - currentTime) * 1000;

        if (timeUntilExpiry <= 0) {
          logoutUser();
        } else {
          const timer = setTimeout(() => {
            logoutUser();
          }, timeUntilExpiry);
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  useEffect(() => {
    syncPermissions();
    // Periodically sync every 30 seconds for live updates
    const interval = setInterval(syncPermissions, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="layout-wrapper">
      <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`main-content ${collapsed ? 'collapsed' : 'expanded'}`}>
        <Header />
        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
