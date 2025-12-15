import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useLogo = () => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

<<<<<<< HEAD
  
  const formatImageUrl = (url) => {
    if (!url) return null; 
    try {
=======
  const formatImageUrl = (url) => {
    if (!url) return null; 
    try {
      // Filter out blob URLs that are temporary client-side URLs
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (url.startsWith('blob:')) {
        console.warn("Blob URLs cannot be used:", url);
        return null;
      }

<<<<<<< HEAD
=======
      // Handle absolute URLs
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

<<<<<<< HEAD
=======
      // For relative URLs starting with /uploads, /api, etc.
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (url.startsWith('/')) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
        return API_BASE ? `${API_BASE}${url}` : url;
      }

<<<<<<< HEAD
=======
      // For relative URLs without leading slash
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
      return API_BASE ? `${API_BASE}/${url}` : `/${url}`;
    } catch (error) {
      console.error('Error formatting URL:', error, url);
      return null;
    }
  };

  const cacheLogoContent = (logoData) => {
    try {
      const cacheData = {
        logo: logoData,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('cachedLogoContent', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching logo content:', error);
    }
  };

  const getCachedLogoContent = () => {
    try {
      const cachedData = localStorage.getItem('cachedLogoContent');
      if (!cachedData) return null;
      
      const { logo, timestamp } = JSON.parse(cachedData);
      const now = new Date().getTime();
      const cacheAge = now - timestamp;

<<<<<<< HEAD
=======
      // Cache for 30 minutes
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (cacheAge < 30 * 60 * 1000) {
        return logo;
      }
      
      return null;
    } catch (error) {
      console.error('Error reading cached logo content:', error);
      return null;
    }
  };

  const fetchLogo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const timestamp = new Date().getTime();
      const response = await axios.get(`/api/content?t=${timestamp}`, {
        timeout: 5000
      });
      
      if (response.data && response.data.logo?.imageUrl) {
        const formattedUrl = formatImageUrl(response.data.logo.imageUrl);
        setLogoUrl(formattedUrl);
        cacheLogoContent({ imageUrl: formattedUrl });
      } else {
<<<<<<< HEAD
=======
        // No logo in response, use cached if available
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        const cachedLogo = getCachedLogoContent();
        if (cachedLogo?.imageUrl) {
          setLogoUrl(cachedLogo.imageUrl);
        } else {
          setLogoUrl(null);
        }
      }
    } catch (error) {
      console.error("Error fetching logo:", error);
      setError(error);
<<<<<<< HEAD

=======
      
      // Try to use cached logo on error
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const cachedLogo = getCachedLogoContent();
      if (cachedLogo?.imageUrl) {
        setLogoUrl(cachedLogo.imageUrl);
      } else {
        setLogoUrl(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshLogo = useCallback(async () => {
<<<<<<< HEAD
    localStorage.removeItem('cachedLogoContent');
=======
    // Clear cache
    localStorage.removeItem('cachedLogoContent');
    // Fetch fresh logo
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    await fetchLogo();
  }, [fetchLogo]);

  useEffect(() => {
    fetchLogo();
<<<<<<< HEAD

=======
    
    // Add storage event listener to refresh logo when admin updates are made
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const handleStorageChange = (e) => {
      if (e.key === 'contentUpdated') {
        refreshLogo();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchLogo, refreshLogo]);

  return {
    logoUrl,
    isLoading,
    error,
    refreshLogo,
    formatImageUrl
  };
};
