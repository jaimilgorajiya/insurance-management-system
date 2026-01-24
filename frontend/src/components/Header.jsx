import React from 'react';
import { MenuIcon, SearchIcon, BellIcon } from './LayoutIcons';
import './Layout.css';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="top-header">
      <div className="header-left">
      
        <div className="search-bar">
          <SearchIcon />
          <input 
            type="text" 
            placeholder="Search customers, policies, claims..." 
            className="search-input"
          />
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn">
          <BellIcon />
          <span className="notification-badge"></span>
        </button>
        
        <div className="user-profile">
          <div className="user-avatar">
            AD
          </div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
