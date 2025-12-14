import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useLogo = () => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const formatImageUrl = (url) => {
    if (!url) return null; 
    try {
      if (url.startsWith('blob:')) {
        console.warn("Blob URLs cannot be used:", url);
        return null;
      }

      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      if (url.startsWith('/')) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
        return API_BASE ? `${API_BASE}${url}` : url;
      }

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
    localStorage.removeItem('cachedLogoContent');
    await fetchLogo();
  }, [fetchLogo]);

  useEffect(() => {
    fetchLogo();

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
