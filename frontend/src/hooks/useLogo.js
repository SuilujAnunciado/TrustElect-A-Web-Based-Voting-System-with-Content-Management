import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useLogo = () => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatImageUrl = (url) => {
    if (!url) return null; 
    try {
      // Filter out blob URLs that are temporary client-side URLs
      if (url.startsWith('blob:')) {
        console.warn("Blob URLs cannot be used:", url);
        return null;
      }

      // Handle absolute URLs
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      // For relative URLs starting with /uploads, /api, etc.
      if (url.startsWith('/')) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
        return API_BASE ? `${API_BASE}${url}` : url;
      }

      // For relative URLs without leading slash
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

      // Cache for 30 minutes
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
        // No logo in response, use cached if available
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
      
      // Try to use cached logo on error
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
    // Clear cache
    localStorage.removeItem('cachedLogoContent');
    // Fetch fresh logo
    await fetchLogo();
  }, [fetchLogo]);

  useEffect(() => {
    fetchLogo();
    
    // Add storage event listener to refresh logo when admin updates are made
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
