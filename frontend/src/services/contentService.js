import axios from 'axios';

const API_URL = ''; t

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (config && config.__isRetry) {
      return Promise.reject(error);
    }

    
    const isRetryable = 
      !response || 
      response.status >= 500 || 
      response.status === 429; 
    
    if (isRetryable && config) {
      config.__isRetry = true;

      const retryCount = config.__retryCount || 0;
      if (retryCount < 2) { 
        config.__retryCount = retryCount + 1;

        const delay = Math.pow(2, retryCount) * 1000;

        
        return new Promise(resolve => {
          setTimeout(() => resolve(apiClient(config)), delay);
        });
      }
    }
    
    return Promise.reject(error);
  }
);

/**

 * @returns {Promise<boolean>}
 */
export const checkApiConnection = async () => {
  try {
    await axios.head(`/api/healthcheck`, { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};

/**

 * @returns {Promise<Object>} 
 */
export const getLandingContent = async () => {
  try {
    const timestamp = new Date().getTime();
    const response = await apiClient.get(`/api/content?t=${timestamp}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching landing content:', error);
    throw error;
  }
};

/**
 * @param {Object} content 
 */
export const cacheLandingContent = (content) => {
  try {
    const cacheData = {
      content,
      timestamp: new Date().getTime()
    };
    localStorage.setItem('cachedLandingContent', JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching content:', error);
  }
};

/**
 * @param {number} maxAgeMinutes 
 * @returns {Object|null} 
 */
export const getCachedLandingContent = (maxAgeMinutes = 30) => {
  try {
    const cachedData = localStorage.getItem('cachedLandingContent');
    if (!cachedData) return null;
    
    const { content, timestamp } = JSON.parse(cachedData);
    const now = new Date().getTime();
    const cacheAge = now - timestamp;
    if (cacheAge < maxAgeMinutes * 60 * 1000) {
      return content;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading cached content:', error);
    return null;
  }
};

/**

 * @param {string} section 
 * @returns {Promise<Object>}
 */
export const getSectionContent = async (section) => {
  try {
    const timestamp = new Date().getTime();
    const response = await apiClient.get(`/api/content/${section}?t=${timestamp}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${section} content:`, error);
    throw error;
  }
};

/**
 * @param {string} section 
 * @param {Object} contentData 
 * @param {Object} files 
 * @returns {Promise<Object>} 
 */
export const saveSectionContent = async (section, contentData, files = {}) => {
  try {
    const formData = new FormData();

    formData.append('content', JSON.stringify(contentData));

    Object.keys(files).forEach(key => {
      if (files[key]) {
        formData.append(key, files[key]);
      }
    });
    const timestamp = new Date().getTime();
    
    const response = await apiClient.post(
      `/api/content/${section}?t=${timestamp}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error saving ${section} content:`, error);
    if (error.response?.status === 413) {
      const enhancedError = new Error('File too large. Please try a smaller video file (max 200MB).');
      enhancedError.status = 413;
      throw enhancedError;
    }
    
    throw error;
  }
};

/**

 * @param {string} type
 * @returns {Promise<Array>} 
 */
export const getAllMedia = async (type = null) => {
  try {
    let url = '/api/content/media/all';
    if (type) {
      url += `?type=${type}`;
    }
    
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching media files:', error);
    throw error;
  }
};

/**
 * @param {number} id 
 * @returns {Promise<Object>}
 */
export const deleteMedia = async (id) => {
  try {
    const response = await apiClient.delete(`/api/content/media/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting media with ID ${id}:`, error);
    throw error;
  }
};

/**
 * @param {string} url
 * @returns {string|null} 
 */
export const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('blob:')) return url;
  if (url.startsWith('http')) return url;
  return url.startsWith('/') ? url : `/${url}`;
};

const ContentService = {
  checkApiConnection,
  getLandingContent,
  cacheLandingContent,
  getCachedLandingContent,
  getSectionContent,
  saveSectionContent,
  getAllMedia,
  deleteMedia,
  formatImageUrl
};

export default ContentService;