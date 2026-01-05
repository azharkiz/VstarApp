// ...existing code...
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const login = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    const body = payload ?? { employee: 'Admin' };
    try {
      const response = await axios.post('https://test.winfocus.in/api/Login', body, {
        headers: { 'Content-Type': 'application/json' },
      });

      // Normalize response shape: return token and user where possible
      const data = response?.data ?? {};
      const token =
        data.token ?? data.Token ?? data.data?.token ?? data.data?.Token ?? null;
      const user = data.user ?? data.User ?? data.data?.user ?? data.data?.User ?? null;

      return { token, user, raw: data };
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  token: null,
  user: null,
  loggedIn: false,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action) {
      state.token = action.payload?.token ?? null;
      state.user = action.payload?.user ?? null;
      state.loggedIn = !!state.token;
      state.error = null;
      state.status = 'succeeded';
    },
    clearAuth(state) {
      state.token = null;
      state.user = null;
      state.loggedIn = false;
      state.status = 'idle';
      state.error = null;
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
        state.token = action.payload?.token ?? null;
        state.user = action.payload?.user ?? null;
        state.loggedIn = !!state.token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message || 'Login failed';
      });
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
// ...existing code...