import axios from 'axios';

export const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

// Add interceptor for Bearer token
API.interceptors.request.use((req) => {
  if (sessionStorage.getItem('userInfo')) {
    req.headers.Authorization = `Bearer ${JSON.parse(sessionStorage.getItem('userInfo')).token}`;
  }
  return req;
});

// Add interceptor to sanitize legacy localhost URLs from database
API.interceptors.response.use((response) => {
  if (response.data) {
    const sanitizeUrls = (obj) => {
      if (typeof obj === 'string') {
        // If already an absolute URL (Cloudinary), don't touch it
        if (obj.startsWith('http')) return obj;

        const cleaned = obj.replace(/http:\/\/localhost:5000/g, '');
        if (cleaned.startsWith('/uploads/') || cleaned.startsWith('uploads/')) {
            const prefix = cleaned.startsWith('/') ? '' : '/';
            return `${BACKEND_URL}${prefix}${cleaned}`;
        }
        return cleaned;
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeUrls);
      } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = sanitizeUrls(obj[key]);
          }
        }
        return newObj;
      }
      return obj;
    };
    response.data = sanitizeUrls(response.data);
  }
  return response;
});

export default API;
