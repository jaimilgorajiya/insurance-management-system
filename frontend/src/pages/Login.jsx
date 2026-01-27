import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

// SVG Icons
const ShieldIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7V12C3 17.5228 6.91731 22.3687 12 23.6933C17.0827 22.3687 21 17.5228 21 12V7L12 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EmailIcon = () => (
  <svg className="input-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 6L12 13L2 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = () => (
  <svg className="input-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    // 1. Check for stored credentials (Remember Me)
    const storedEmail = localStorage.getItem('rememberedEmail');
    const storedPassword = localStorage.getItem('rememberedPassword');
    const isRemembered = localStorage.getItem('rememberMe') === 'true';

    if (isRemembered && storedEmail) {
      setEmail(storedEmail);
      setRememberMe(true);
      if (storedPassword) {
        try {
          setPassword(atob(storedPassword)); // Decode password
        } catch (e) {
          console.error("Failed to decode password", e);
        }
      }
    }

    // 2. Redirect if already logged in (Role check)
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token && role) {
      redirectBasedOnRole(role);
    }
  }, []);

  const redirectBasedOnRole = (role) => {
    const rolePaths = {
      admin: '/admin/dashboard',
      agent: '/agent/dashboard',
      customer: '/customer/dashboard',
    };

    const targetPath = rolePaths[role];
    if (targetPath) {
      navigate(targetPath, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      if (data.success) {
        const { accessToken, user } = data.data;
        
        // Store auth data
        localStorage.setItem('token', accessToken);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userPermissions', JSON.stringify(user.permissions || {}));
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userId', user._id);
        localStorage.setItem('userEmail', user.email);

        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedPassword', btoa(password)); // Encode password
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
          localStorage.removeItem('rememberMe');
        }

        // Redirect
        redirectBasedOnRole(user.role);
      } else {
         setError(data.message || 'Login failed.');
      }

    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || 'Unable to connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-header">
           <div className="logo-background">
             <ShieldIcon />
           </div>
           <h1 className="brand-title">InsureCRM</h1>
           <p className="login-subtitle">Sign in to access your dashboard</p>
        </div>

        <div className="login-card">
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label className="login-form-label" htmlFor="email">Email Address</label>
              <div className="login-input-group">
                <span className="login-input-icon">
                  <EmailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  className="login-form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-form-group">
              <label className="login-form-label" htmlFor="password">Password</label>
              <div className="login-input-group">
                <span className="login-input-icon">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type="password"
                  className="login-form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
               </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <div className="checkbox-wrapper">
                   <input 
                      type="checkbox" 
                      id="remember" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                   />
                   <span className="custom-checkbox"></span>
                </div>
                Remember me
              </label>
            </div>

            <button type="submit" className="login-btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        
        <footer className="login-footer">
          <p>© 2026 InsureCRM. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
