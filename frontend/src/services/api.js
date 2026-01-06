import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Interceptor: Add X-User-ID header to all requests
API.interceptors.request.use((config) => {
  const userId = localStorage.getItem("sentinel_user") || "anonymous";
  config.headers["X-User-ID"] = userId;
  return config;
});

// Interceptor: Better error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`API Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error("No response from backend:", error.request);
    } else {
      console.error("Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
