import { useState, useEffect } from 'react';

/**
 * Permission utility to check granular access in the UI.
 * Admins always have full access.
 */
export const hasPermission = (module, action) => {
    const role = localStorage.getItem('userRole');
    
    // Admin bypass
    if (role === 'admin') return true;
    
    // Customer bypass (handled separately or restricted by role)
    if (role === 'customer') return false;

    try {
        const permissionsStr = localStorage.getItem('userPermissions');
        if (!permissionsStr) return false;

        const permissions = JSON.parse(permissionsStr);
        
        // Check if permission exists and is true
        return !!(permissions[module] && permissions[module][action]);
    } catch (error) {
        console.error("Error parsing permissions:", error);
        return false;
    }
};

/**
 * Force sync permissions from backend to localStorage
 */
export const syncPermissions = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
                const oldPerms = localStorage.getItem('userPermissions');
                const newPerms = JSON.stringify(data.user.permissions);
                
                // Only update if changed to avoid unnecessary re-renders in some contexts
                if (oldPerms !== newPerms) {
                    localStorage.setItem('userPermissions', newPerms);
                    localStorage.setItem('userRole', data.user.role);
                    // Dispatch custom event to notify components
                    window.dispatchEvent(new Event('permissionsChanged'));
                }
            }
        }
    } catch (error) {
        console.error("Failed to sync permissions:", error);
    }
};

// Sync when tab becomes visible
if (typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            syncPermissions();
        }
    });
}

/**
 * Hook-like usage if needed (can be used in functional components)
 * Automatically re-renders when permissions are synced
 */
export const usePermission = () => {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const handleSync = () => setTick(t => t + 1);
        window.addEventListener('permissionsChanged', handleSync);
        
        // Auto-refresh permissions every 3 seconds to keep UI in sync
        const interval = setInterval(() => {
            syncPermissions();
        }, 3000);

        return () => {
            window.removeEventListener('permissionsChanged', handleSync);
            clearInterval(interval);
        };
    }, []);

    return { hasPermission, syncPermissions, permissionsUpdated: tick };
};
