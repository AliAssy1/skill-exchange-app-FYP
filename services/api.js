import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ============================================================
// ⚠️  IMPORTANT: SET YOUR COMPUTER'S IP ADDRESS HERE
// ⚠️  Run "ipconfig" (Windows) or "ifconfig" (Mac/Linux) 
// ⚠️  and find your IPv4 address (e.g. 192.168.x.x)
// ============================================================
const SERVER_IP = '172.20.10.3';
const SERVER_PORT = '5000';
// ============================================================

// Auto-detect the right URL based on platform
function getBaseUrl() {
  if (Platform.OS === 'web') {
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
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add token to headers
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
