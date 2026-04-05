import axios from "axios";

// Dynamically determine the base URL
const getBaseUrl = () => {
  // If we're in development (localhost), use localhost
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8000";
  }
  // Otherwise, we're accessed via IP (from iPad), so use the same hostname
  // This works because your React app is served from http://YOUR_MAC_IP:3000
  // So the backend is at the same IP but port 8000
  return `http://${window.location.hostname}:8000`;
};

const baseURL = getBaseUrl();
console.log("📡 API Base URL configured as:", baseURL); // ADD THIS LINE

const api = axios.create({
  baseURL: baseURL,
});

// Automatically attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;