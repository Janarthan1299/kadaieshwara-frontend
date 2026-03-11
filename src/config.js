// API Configuration
// Remove trailing slash to prevent double slashes in URLs
const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const API_URL = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
