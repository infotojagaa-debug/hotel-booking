import axios from 'axios';

export const BACKEND_URL = 'http://localhost:5000';

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

export default API;
