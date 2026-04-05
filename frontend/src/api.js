import axios from 'axios';

// baseURL logic that works in both Vite (browser) and Node.js (vite.config.js)
const baseURL = (typeof process !== 'undefined' && process.env.VITE_API_BASE_URL) || 
                (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 
                'http://localhost:5000/';

const api = axios.create({
  baseURL,
});

export default api;

