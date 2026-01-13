// ...existing code...
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';

// thunk to fetch outbound files
export const fetchOutBoundFiles = createAsyncThunk(
  'outbound/fetchOutBoundFiles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/fetchFiles');
      return response?.data ?? [];
    } catch (error) {
      return rejectWithValue(error?.response?.data ?? { message: error?.message ?? 'Request failed' });
    }
  }
);

// NEW: thunk to fetch details for a specific file (called from Scan button)
export const fetchFileDetails = createAsyncThunk(
  'outbound/fetchFileDetails',
  async (payload, { rejectWithValue }) => {
    try {
      // accept either a string or an object { filename }
      const filename = typeof payload === 'string' ? payload : payload?.filename;
      if (!filename) return rejectWithValue({ message: 'filename is required' });

      const body = { filename };
      const response = await apiClient.post('/data', body, {
        headers: { 'Content-Type': 'application/json' },
      });

      return response?.data ?? null;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data ?? { message: error?.message ?? 'Request failed' }
      );
    }
  }
);

const initialState = {
  items: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,

  // new fields for file details
  details: null,
  detailsStatus: 'idle',
  detailsError: null,
};

const outBoundSlice = createSlice({
  name: 'outbound',
  initialState,
  reducers: {
    clearOutBound(state) {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
    // NEW: clear selected details
    clearOutBoundDetails(state) {
      state.details = null;
      state.detailsStatus = 'idle';
      state.detailsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOutBoundFiles.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOutBoundFiles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload ?? [];
      })
      .addCase(fetchOutBoundFiles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error?.message;
      })

      // handlers for file details thunk
      .addCase(fetchFileDetails.pending, (state) => {
        state.detailsStatus = 'loading';
        state.detailsError = null;
      })
      .addCase(fetchFileDetails.fulfilled, (state, action) => {
        state.detailsStatus = 'succeeded';
        state.details = action.payload ?? null;
      })
      .addCase(fetchFileDetails.rejected, (state, action) => {
        state.detailsStatus = 'failed';
        state.detailsError = action.payload ?? action.error?.message;
      });
  },
});

export const { clearOutBound, clearOutBoundDetails } = outBoundSlice.actions;

export const selectOutBound = (state) => {
  const slice = state?.outbound ?? {};
  return {
    items: slice.items ?? [],
    status: slice.status ?? 'idle',
    error: slice.error ?? null,
    details: slice.details ?? null,
    detailsStatus: slice.detailsStatus ?? 'idle',
    detailsError: slice.detailsError ?? null,
  };
};

export default outBoundSlice.reducer;
// ...existing code...