import React, { useState, useEffect } from 'react';
import { syncPermissions, usePermission } from '../utils/permissionUtils';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { permissionsUpdated } = usePermission();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

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
