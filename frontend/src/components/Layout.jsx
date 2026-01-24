import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

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
