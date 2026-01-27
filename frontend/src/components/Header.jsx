import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuIcon, SearchIcon, BellIcon } from './LayoutIcons';
import './Layout.css';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole') || 'Guest';

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
        
        <div 
          className="user-profile" 
          onClick={() => navigate('/profile')}
          style={{ cursor: 'pointer' }}
          title="View Profile"
        >
          <div className="user-avatar">
            {getInitials(userName)}
          </div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-role" style={{ textTransform: 'capitalize' }}>{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
