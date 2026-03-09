import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 15000
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error messages
    if (error.response?.data?.detail) {
      error.message = Array.isArray(error.response.data.detail)
        ? error.response.data.detail.map((d) => d.msg || d).join(', ')
        : error.response.data.detail;
    }
    return Promise.reject(error);
  }
);

export default api;

