import axios from "axios";

const getBaseURL = () => {
  // Use environment variable if available (set in .env as VITE_API_URL)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In development, if no env var is set, use localhost
  if (import.meta.env.DEV) {
    return "http://localhost:8080/api/v1";
  }

  // In production, if no VITE_API_URL is provided, fallback to relative path /api/v1
  // This helps when hosting front/back on the same domain
  return "/api/v1";
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Optional: redirect to login or trigger a global logout state
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
