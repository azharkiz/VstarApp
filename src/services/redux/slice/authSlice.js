import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import { getNewToken } from '../../api/tokenHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthCheck } from "../../Context/AuthContext";
/**
 * Thunks
 */
export const login = createAsyncThunk(
  'auth/login',
  async ({ employee }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/Login', { employee });
      const data = response?.data || {};

      const token = data.token || null;
      // accept common key names from backend
      const refreshToken = data.refreshToken ?? data.refresh_token ?? null;

      await AsyncStorage.setItem(
        'auth',
        JSON.stringify({
          token,
          // persist both common key names so tokenHelper / refresh logic can find it
          refreshToken,
          refresh_token: refreshToken,
          employee: data.employee ?? employee,
        })
      );

      if (token) apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;

      return data;
    } catch (error) {
      const payload = error?.response?.data ?? { message: error?.message ?? 'Login failed' };
      return rejectWithValue(payload);
    }
  }
);

export const refreshAuthToken = createAsyncThunk(
  'auth/refresh-token',
  async (_, { rejectWithValue }) => {
    try {
      const newToken = await getNewToken();
      if (!newToken) return rejectWithValue({ message: 'Refresh failed' });

      apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      return { token: newToken };
    } catch (error) {
      // cleanup on refresh failure so app can return to login
      try {
        await AsyncStorage.removeItem('auth');
        await AsyncStorage.removeItem('isLoggedIn');
      } catch (e) {
        // ignore
      }
      try {
        if (apiClient?.defaults?.headers) {
          delete apiClient.defaults.headers.common.Authorization;
        }
      } catch (e) {
        // ignore
      }
      const payload = error?.response?.data ?? { message: error?.message ?? 'Refresh failed' };
      return rejectWithValue(payload);
    }
  }
);

/**
 * Slice
 */
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    status: 'idle',
    error: null,
    token: null,
    refreshToken: null,
    employee: null,
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.employee = null;
    },
    // sessionOut: used when session expired - do NOT use React hooks in slice
    sessionOut(state) {
      state.token = null;
      state.refreshToken = null;
      state.employee = null;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const payload = action.payload || {};
        state.token = payload.token ?? null;
        state.refreshToken = payload.refreshToken ?? payload.refresh_token ?? null;
        state.employee = payload.employee ?? null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error?.message;
      })
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload?.token ?? state.token;
      })
      .addCase(refreshAuthToken.rejected, (state, action) => {
        state.error = action.payload ?? action.error?.message;
      });
  },
});

/**
 * Thunks / helpers for logout / session expiration that can perform side effects.
 * These are safe to call from non-React places (e.g. apiClient interceptors).
 */
export const performLogout = () => {
  return async (dispatch) => {
    try {
      await AsyncStorage.removeItem('auth');
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('scannedData');
      await AsyncStorage.removeItem('scannedDataByFile');
      try {
        if (typeof apiClient !== 'undefined' && apiClient?.defaults?.headers) {
          delete apiClient.defaults.headers.common.Authorization;
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.warn('performLogout cleanup failed', err);
    } finally {
      dispatch(logout());
    }
  };
};

export const sessionExpired = () => {
  return async (dispatch) => {
    try {
      // persistent cleanup
      await AsyncStorage.removeItem('auth');
      await AsyncStorage.removeItem('isLoggedIn');
      // clear axios header
      try {
        if (typeof apiClient !== 'undefined' && apiClient?.defaults?.headers) {
          delete apiClient.defaults.headers.common.Authorization;
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore
    }
    // clear redux auth state
    dispatch(sessionOut());
  };
};

export const { logout, sessionOut } = authSlice.actions;

export default authSlice.reducer;