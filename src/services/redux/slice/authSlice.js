import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import { getNewToken } from '../../api/tokenHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ...existing code...
export const login = createAsyncThunk(
  'auth/login',
  async ({ employee }, { rejectWithValue }) => {
    try {
      // send body as object (your API expects POST /Login)
      const response = await apiClient.post('/Login', { employee });
      const data = response?.data || {};

      const token = data.token || null;
      const refreshToken = data.refreshToken || null;

      // persist auth info for refresh flow
      await AsyncStorage.setItem(
        'auth',
        JSON.stringify({ token, refreshToken, employee: data.employee ?? employee })
      );

      // set default header for future requests
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
      // getNewToken should update AsyncStorage and return the new access token string
      const newToken = await getNewToken();
      if (!newToken) return rejectWithValue({ message: 'Refresh failed' });

      apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      return { token: newToken };
    } catch (error) {
      const payload = error?.response?.data ?? { message: error?.message ?? 'Refresh failed' };
      return rejectWithValue(payload);
    }
  }
);
// ...existing code...

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
      // clear persisted auth
      AsyncStorage.removeItem('auth').catch(() => {});
      delete apiClient.defaults.headers.common.Authorization;
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
        state.refreshToken = payload.refreshToken ?? null;
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

export const { logout } = authSlice.actions;

export default authSlice.reducer;