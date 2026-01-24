import axios from 'axios';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNewToken } from './tokenHelper';

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
        // if there's no response (network error, timeout, CORS, etc.) just reject
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
                const newToken = await getNewToken(); // tokenHelper must update AsyncStorage
                // set default header for future requests
                apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;