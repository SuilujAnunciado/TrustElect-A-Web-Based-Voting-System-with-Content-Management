const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

<<<<<<< HEAD
=======
// Add BASE_URL export
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
export const BASE_URL = API_URL;

export const config = {
  API_URL,
  API_BASE: process.env.NEXT_PUBLIC_API_URL || '',
  UPLOADS_URL: `/uploads`,
  PUBLIC_URL: `/public`,
};

export const formatImageUrl = (url) => {
  if (!url) return null;
  
  try {
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }

<<<<<<< HEAD
    
=======
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

<<<<<<< HEAD
=======
    // Remove any leading slashes and keep same-origin path
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const cleanPath = url.replace(/^\/+/, '');
    return `/${cleanPath}`;
  } catch (error) {
    console.error('Error formatting URL:', error, url);
    return null;
  }
};

export default config;