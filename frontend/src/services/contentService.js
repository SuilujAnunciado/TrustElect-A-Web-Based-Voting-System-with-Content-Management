import axios from 'axios';

<<<<<<< HEAD
const API_URL = ''; t

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, 
=======
// API base URL
const API_URL = ''; // use same-origin so Next.js rewrites proxy the request

// Create Axios instance with defaults
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  headers: {
    'Content-Type': 'application/json',
  }
});

<<<<<<< HEAD
=======
// Response interceptor for retrying failed requests
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
<<<<<<< HEAD

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

=======
    
    // If this is already a retry, don't retry again
    if (config && config.__isRetry) {
      return Promise.reject(error);
    }
    
    // Determine if error is retryable
    const isRetryable = 
      !response || // Network errors (no response)
      response.status >= 500 || // Server errors
      response.status === 429; // Rate limited
    
    if (isRetryable && config) {
      config.__isRetry = true;
      
      // Exponential backoff
      const retryCount = config.__retryCount || 0;
      if (retryCount < 2) { // Maximum 2 retries
        config.__retryCount = retryCount + 1;
        
        // Delay with exponential backoff (1s, then 3s)
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD

 * @returns {Promise<boolean>}
 */
export const checkApiConnection = async () => {
  try {
=======
 * Check if the API is reachable
 * @returns {Promise<boolean>} Whether API is reachable
 */
export const checkApiConnection = async () => {
  try {
    // Use same-origin so it goes through the rewrite
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    await axios.head(`/api/healthcheck`, { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};

/**
<<<<<<< HEAD

 * @returns {Promise<Object>} 
 */
export const getLandingContent = async () => {
  try {
=======
 * Get all landing content
 * @returns {Promise<Object>} Landing content
 */
export const getLandingContent = async () => {
  try {
    // Add cache-busting timestamp
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const timestamp = new Date().getTime();
    const response = await apiClient.get(`/api/content?t=${timestamp}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching landing content:', error);
    throw error;
  }
};

/**
<<<<<<< HEAD
 * @param {Object} content 
=======
 * Cache landing content in localStorage
 * @param {Object} content Content to cache
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
 * @param {number} maxAgeMinutes 
 * @returns {Object|null} 
=======
 * Get cached landing content
 * @param {number} maxAgeMinutes Maximum age in minutes for cache to be valid
 * @returns {Object|null} Cached content or null if invalid/not found
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
 */
export const getCachedLandingContent = (maxAgeMinutes = 30) => {
  try {
    const cachedData = localStorage.getItem('cachedLandingContent');
    if (!cachedData) return null;
    
    const { content, timestamp } = JSON.parse(cachedData);
    const now = new Date().getTime();
    const cacheAge = now - timestamp;
<<<<<<< HEAD

=======
    
    // Convert maxAgeMinutes to milliseconds
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD

 * @param {string} section 
 * @returns {Promise<Object>}
 */
export const getSectionContent = async (section) => {
  try {
=======
 * Get content for a specific section
 * @param {string} section Section to get content for
 * @returns {Promise<Object>} Section content
 */
export const getSectionContent = async (section) => {
  try {
    // Add cache-busting timestamp
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const timestamp = new Date().getTime();
    const response = await apiClient.get(`/api/content/${section}?t=${timestamp}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${section} content:`, error);
    throw error;
  }
};

/**
<<<<<<< HEAD
 * @param {string} section 
 * @param {Object} contentData 
 * @param {Object} files 
 * @returns {Promise<Object>} 
=======
 * Save content for a specific section
 * @param {string} section Section to save content for
 * @param {Object} contentData Content data
 * @param {Object} files Files to upload (optional)
 * @returns {Promise<Object>} Updated section content
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
 */
export const saveSectionContent = async (section, contentData, files = {}) => {
  try {
    const formData = new FormData();
<<<<<<< HEAD

    formData.append('content', JSON.stringify(contentData));

=======
    
    // Add content data
    formData.append('content', JSON.stringify(contentData));
    
    // Add files if provided
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    Object.keys(files).forEach(key => {
      if (files[key]) {
        formData.append(key, files[key]);
      }
    });
<<<<<<< HEAD

=======
    
    // Add cache-busting timestamp
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD

=======
    
    // Handle specific error cases
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (error.response?.status === 413) {
      const enhancedError = new Error('File too large. Please try a smaller video file (max 200MB).');
      enhancedError.status = 413;
      throw enhancedError;
    }
    
    throw error;
  }
};

/**
<<<<<<< HEAD

 * @param {string} type
 * @returns {Promise<Array>} 
=======
 * Get all media files
 * @param {string} type Optional file type filter (image, video)
 * @returns {Promise<Array>} Media files
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
 * @param {number} id 
 * @returns {Promise<Object>}
=======
 * Delete a media file
 * @param {number} id Media ID to delete
 * @returns {Promise<Object>} Response data
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
 * @param {string} url
 * @returns {string|null} 
=======
 * Format image URL to ensure it points to the API
 * @param {string} url URL to format
 * @returns {string|null} Formatted URL
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
 */
export const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('blob:')) return url;
  if (url.startsWith('http')) return url;
<<<<<<< HEAD
=======
  // Return a same-origin path so Next rewrites proxy /uploads
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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