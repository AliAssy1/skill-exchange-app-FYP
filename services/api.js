import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

// ============================================================
// ⚠️  CONFIGURATION
// ⚠️  For local development: set SERVER_IP to your computer's IP
// ⚠️  For production: set PRODUCTION_API_URL to your deployed backend
// ============================================================
const SERVER_IP = "172.20.10.2";
const SERVER_PORT = "5000";

// 🚀 Set this to your deployed backend URL (e.g., https://your-app.up.railway.app)
const PRODUCTION_API_URL = "https://backend-production-4ef1.up.railway.app";
// ============================================================

// Auto-detect the right URL based on platform and environment
function getBaseUrl() {
  // If production URL is set, always use it
  if (PRODUCTION_API_URL) {
    return `${PRODUCTION_API_URL}/api`;
  }
  if (Platform.OS === "web") {
    return `http://localhost:${SERVER_PORT}/api`;
  }
  // Physical device (Expo Go) - use the computer's IP
  return `http://${SERVER_IP}:${SERVER_PORT}/api`;
}

const API_BASE_URL = getBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor to add token to headers
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);

export default api;
export { API_BASE_URL };

