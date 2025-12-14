"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const normalizeRole = (role) => {
  if (!role) return '';

  const lowercaseRole = typeof role === 'string' ? role.toLowerCase() : '';
  
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

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

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

  const fetchNotifications = useCallback(async (limit = 10, offset = 0) => {
    setLoading(true);
    setError(null);

    const limitNum = Number(limit);
    const offsetNum = Number(offset);
    
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

      if (err.response && (err.response.status === 401 || err.response.status === 403)) {

        Cookies.remove('token');
        Cookies.remove('role');

        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

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

        setUnreadCount(prev => Math.max(0, prev - 1));
        
        return true;
      } else {
        console.error('API reported error:', response.data.message);
        return false;
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);

      if (err.response && (err.response.status === 401 || err.response.status === 403)) {

        Cookies.remove('token');
        Cookies.remove('role');

        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      
      return false;
    }
  }, [API_URL]);

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
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        
        setUnreadCount(0);
        
       
        return true;
      } else {
        console.error('API reported error:', response.data.message);
        return false;
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        
        Cookies.remove('token');
        Cookies.remove('role');
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      
      return false;
    }
  }, [API_URL]);

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
        const wasUnread = notifications.find(n => n.id === parseInt(notificationId) && !n.is_read);
        
        setNotifications(prev => 
          prev.filter(notification => notification.id !== parseInt(notificationId))
        );
        
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

      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
  
        Cookies.remove('token');
        Cookies.remove('role');
 
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      
      return false;
    }
  }, [API_URL, notifications]);

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
      
      if (notifications.length > 0) {
        fetchNotifications(10, 0).then(data => {
          setNotifications(data || []);
        });
      }
    }, 30000);
    
    return () => {
      clearInterval(interval);
    }
  }, [fetchNotifications, countUnreadNotifications, notifications.length]);

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