import axios from 'axios';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNewToken } from './tokenHelper';
import { sessionExpired } from '../redux/slice/authSlice';

const BASE_URL = Config?.API_URL || 'http://115.247.202.166:56854/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 40000,
});

// queue to hold requests while refresh is in progress
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

const getStore = () => {
  try {
    const mod = require('../redux/rootRrducer/index');
    return mod && (mod.default || mod.store || mod);
  } catch (e) {
    console.warn('apiClient.getStore: failed to require store', e);
    return null;
  }
};

// Attach token from AsyncStorage before each request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const raw = await AsyncStorage.getItem('auth');
      if (raw) {
        const { token } = JSON.parse(raw);
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // ignore storage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to refresh token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error || !error.response) return Promise.reject(error);

    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      // if a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await getNewToken();
        if (newToken) {
          // update default header and retry original request
          apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }

        // no refresh token available -> force logout via redux (lazy require)
        const store = getStore();
        if (store && typeof store.dispatch === 'function') {
          try {
            await store.dispatch(sessionExpired());
          } catch (e) {
            // ignore dispatch failures
          }
        } else {
          console.warn('apiClient: store unavailable to dispatch sessionExpired');
        }

        return Promise.reject(error);
      } catch (refreshErr) {
        processQueue(refreshErr, null);

        // refresh attempt failed (network/server) -> dispatch sessionExpired if possible
        const store = getStore();
        if (store && typeof store.dispatch === 'function') {
          try {
            await store.dispatch(sessionExpired());
          } catch (e) {
            // ignore
          }
        } else {
          console.warn('apiClient: store unavailable to dispatch sessionExpired on refresh error');
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;