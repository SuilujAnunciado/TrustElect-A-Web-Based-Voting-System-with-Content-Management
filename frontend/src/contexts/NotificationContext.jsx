"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const normalizeRole = (role) => {
  if (!role) return '';
<<<<<<< HEAD

  const lowercaseRole = typeof role === 'string' ? role.toLowerCase() : '';
  
=======
  
  
 
  const lowercaseRole = typeof role === 'string' ? role.toLowerCase() : '';
  
 
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  if (lowercaseRole.includes('super') && lowercaseRole.includes('admin')) {
    return 'superadmin';
  } 
  
  if (lowercaseRole === 'admin') {
    return 'admin';
  } 
  
  if (lowercaseRole === 'student') {
    return 'student';
  }
  

  return lowercaseRole;
};

<<<<<<< HEAD
const NotificationContext = createContext();

=======
// Create the context
const NotificationContext = createContext();

// Custom hook to use the notification context
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

<<<<<<< HEAD
=======
// Provider component
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

<<<<<<< HEAD
=======
  // Get user's role and token
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const getAuthInfo = useCallback(() => {
    const token = Cookies.get('token');
    const role = Cookies.get('role');
    
    if (!token) {
      console.warn('No authentication token found in cookies');
    } else {
    }
    
    if (!role) {
      console.warn('No role found in cookies');
    } else {
    }
    
    const normalizedRole = normalizeRole(role);
    
    return { token, role: normalizedRole };
  }, []);

<<<<<<< HEAD
=======
  // Fetch notifications from API
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const fetchNotifications = useCallback(async (limit = 10, offset = 0) => {
    setLoading(true);
    setError(null);

    const limitNum = Number(limit);
    const offsetNum = Number(offset);
    
<<<<<<< HEAD
=======
    // Use defaults if parameters are invalid
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const finalLimit = !isNaN(limitNum) ? limitNum : 10;
    const finalOffset = !isNaN(offsetNum) ? offsetNum : 0;

    const { token, role } = getAuthInfo();

    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return [];
    }

    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: finalLimit,
          offset: finalOffset,
        },
      });  
      const fetchedNotifications = response.data.data || [];
       
      setLastFetched(new Date());
      return fetchedNotifications;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
<<<<<<< HEAD

      if (err.response && (err.response.status === 401 || err.response.status === 403)) {

        Cookies.remove('token');
        Cookies.remove('role');

=======
      
      // Handle token expiration
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        
        // Clear cookies
        Cookies.remove('token');
        Cookies.remove('role');
        
        // Redirect to login page after a small delay
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

<<<<<<< HEAD
=======
  // Fetch unread count
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const countUnreadNotifications = useCallback(async () => {
    const { token, role } = getAuthInfo();

    if (!token) {
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Error counting unread notifications:', err);
      console.error('Error details:', err.response || err.message);
    }
  }, [API_URL]);


  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { token } = getAuthInfo();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      
      const response = await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true } 
              : notification
          )
        );
<<<<<<< HEAD

=======
        
        // Update unread count
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        return true;
      } else {
        console.error('API reported error:', response.data.message);
        return false;
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
<<<<<<< HEAD

      if (err.response && (err.response.status === 401 || err.response.status === 403)) {

        Cookies.remove('token');
        Cookies.remove('role');

=======
      
      // Handle token expiration
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        
        // Clear cookies
        Cookies.remove('token');
        Cookies.remove('role');
        
        // Redirect to login page after a small delay
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      
      return false;
    }
  }, [API_URL]);

<<<<<<< HEAD
=======
  // Mark all notifications as read
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const markAllAsRead = useCallback(async () => {
    try {
      const { token, role } = getAuthInfo();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.put(
        `${API_URL}/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
<<<<<<< HEAD
=======
        // Update local state
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        
<<<<<<< HEAD
=======
        // Reset unread count
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        setUnreadCount(0);
        
       
        return true;
      } else {
        console.error('API reported error:', response.data.message);
        return false;
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      
<<<<<<< HEAD
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        
        Cookies.remove('token');
        Cookies.remove('role');
        
=======
      // Handle token expiration
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        
        // Clear cookies
        Cookies.remove('token');
        Cookies.remove('role');
        
        // Redirect to login page after a small delay
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      
      return false;
    }
  }, [API_URL]);

<<<<<<< HEAD
=======
  // Delete a notification
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const { token } = getAuthInfo();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
  
      
      const response = await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
<<<<<<< HEAD
        const wasUnread = notifications.find(n => n.id === parseInt(notificationId) && !n.is_read);
        
=======
        // Find if notification was unread before removing from state
        const wasUnread = notifications.find(n => n.id === parseInt(notificationId) && !n.is_read);
        
        // Update local state
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        setNotifications(prev => 
          prev.filter(notification => notification.id !== parseInt(notificationId))
        );
        
<<<<<<< HEAD
=======
        // Update unread count if the deleted notification was unread
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        return true;
      } else {
        console.error('API reported error:', response.data.message);
        return false;
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
<<<<<<< HEAD

      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
  
        Cookies.remove('token');
        Cookies.remove('role');
 
=======
      
      // Handle token expiration
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        
        // Clear cookies
        Cookies.remove('token');
        Cookies.remove('role');
        
        // Redirect to login page after a small delay
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      
      return false;
    }
  }, [API_URL, notifications]);

<<<<<<< HEAD
=======
  // Load initial data
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  useEffect(() => {
    const { token, role } = getAuthInfo();
    
    if (token) {

      const initialLoadTimeout = setTimeout(() => {
        countUnreadNotifications();
        fetchNotifications(10, 0).then(data => {
          setNotifications(data || []);
        });
      }, 500);
      
      return () => clearTimeout(initialLoadTimeout);
    } 
  }, [fetchNotifications, countUnreadNotifications]);

  useEffect(() => {
    const { token, role } = getAuthInfo();
    if (!token) return;
    
    
    const interval = setInterval(() => {
      countUnreadNotifications();
      
<<<<<<< HEAD
=======
      // Optionally refresh notifications list if the panel is open
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (notifications.length > 0) {
        fetchNotifications(10, 0).then(data => {
          setNotifications(data || []);
        });
      }
<<<<<<< HEAD
    }, 30000);
=======
    }, 30000); // 30 seconds
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    
    return () => {
      clearInterval(interval);
    }
  }, [fetchNotifications, countUnreadNotifications, notifications.length]);

<<<<<<< HEAD
=======
  // Provide the context value
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    lastFetched,
    fetchNotifications,
    countUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 