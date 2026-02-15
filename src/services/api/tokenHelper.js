import axios from 'axios';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = Config?.API_URL || 'http://115.247.202.166:56854/api';

const safeBase64Decode = (b64) => {
  try {
    if (typeof atob === 'function') return atob(b64);
    if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf8');
  } catch (e) {
    // ignore
  }
  return null;
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payloadRaw = safeBase64Decode(parts[1]);
    if (!payloadRaw) return true;
    const payload = JSON.parse(payloadRaw);
    const expirationTime = (payload.exp || 0) * 1000;
    return Date.now() >= expirationTime;
  } catch (e) {
    return true;
  }
};

/**
 * Try to refresh using stored refresh token.
 * Returns new access token string on success, or null if refresh is not possible.
 * Throws only on network/response errors from refresh endpoint.
 */
export async function getNewToken() {
  try {
    const raw = await AsyncStorage.getItem('auth');
    const auth = raw ? JSON.parse(raw) : {};
    const refreshTokenValue = auth.refreshToken || auth.refresh_token || null;

    if (!refreshTokenValue) {
      // No refresh token available — return null so callers can handle logout/cleanup
      console.warn('tokenHelper.getNewToken: no refresh token found in AsyncStorage', auth ? Object.keys(auth) : auth);
      return null;
    }

    const url = `${BASE_URL.replace(/\/$/, '')}/refresh-token`;
    const response = await axios.post(url, { token: refreshTokenValue });
    const { accessToken, refreshToken: newRefreshToken } = response?.data || {};

    if (!accessToken) {
      // treat as failure to refresh
      console.error('tokenHelper.getNewToken: refresh endpoint did not return accessToken', response?.data);
      return null;
    }

    const newAuth = {
      ...auth,
      token: accessToken,
      refreshToken: newRefreshToken || refreshTokenValue,
      refresh_token: newRefreshToken || refreshTokenValue,
    };

    await AsyncStorage.setItem('auth', JSON.stringify(newAuth));
    return accessToken;
  } catch (err) {
    // network / server error — rethrow so apiClient can decide to retry or force logout
    throw err;
  }
}

const tokenHelper = {
  isTokenExpired,
  refreshAccessToken: getNewToken,
};

export default tokenHelper;