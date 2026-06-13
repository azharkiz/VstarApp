// ...existing code...
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import { normalizeFileName } from '../../helper/common';

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

export const fetchOutBoundDeliveryCodes = createAsyncThunk(
  'outbound/fetchOutBoundDeliveryCodes',
  async (payload, { rejectWithValue }) => {
    try {
      // normalize payload: accept filename string or object { filename, ... }
      const body = typeof payload === 'string' ? { filename: payload } : (payload || {});
      // axios/apiClient will serialize object to JSON automatically
      const response = await apiClient.post('/fetchDeliveryCode', body);
      // return the API data (fallback to null or empty array as needed)
      return response.data;
    } catch (error) {
      console.error("fetchOutBoundDeliveryCodes - error:", error);
      return rejectWithValue(
        error?.response?.data ?? { message: error?.message ?? 'Request failed' }
      );
    }
  }
);

export const fetchFullRowByMatch = createAsyncThunk(
  'outbound/fetchFullRowByMatch',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/fetchFullRowByMatch', payload);
      return response.data;
    } catch (error) {
      console.error("fetchFullRowByMatch - error:", error);
      return rejectWithValue(
        error?.response?.data ?? { message: error?.message ?? 'Request failed' }
      );
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
export const saveProductScans = createAsyncThunk(
  'outbound/saveProductScans',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/SaveProductScan', payload, {
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
export const generatePdf = createAsyncThunk(
  'outbound/generatePdf',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/generateNewPdf', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log("PDF generated successfully:", response);
      return response?.data ?? null;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data ?? { message: error?.message ?? 'Request failed' }
      );
    }
  }
);

export const submitProductPacked = createAsyncThunk(
  'outbound/SaveFinalProductScan',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/SaveFinalProductScan', payload, {
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
  scannedDataByFile: {}, // added to store scanned items
  scannedDataByFileNew: {}, // added to store scanned items
  packingDataByFile: {},
  // new fields for file details
  details: null,
  detailsStatus: 'idle',
  itemsScanningStatus: 'idle',
  detailsError: null,
  BoxList: [],
  boxCode: [],
  deliveryCodes: [],
  itemsScanning: [],
  localProductDetails:[],
  productSavedSatus: false,
  itemsScannedProduct:{},
  productScanDetailsRedux:{}
};

const initialStateScanner = {
  error: null,
  scannedDataByFile: {}, // added to store scanned items
  scannedDataByFileNew: {}, // added to store scanned items
   packingDataByFile: {},
  BoxList: [],
  boxCode: [],
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
      state.itemsScanningStatus = 'idle';
      state.itemsScanning = [];
      state.detailsError = null;
    },
    setDeliveryCodes: (state, action) => {
      state.items = action.payload ?? [];
    },
    setScannedData: (state, action) => {
      const { fileName, data } = action.payload;

      // 🔐 safety guard (optional but recommended)
      if (!state.scannedDataByFile) {
        state.scannedDataByFile = {};
      }

      const key = normalizeFileName(fileName);
      state.scannedDataByFile[key] = data;
  },
    setScannedDataNew: (state, action) => {
  const { fileName, data } = action.payload;
  if (!state.scannedDataByFileNew) state.scannedDataByFileNew = {};
  const key = normalizeFileName(fileName);
  if (data === null || typeof data === "undefined") {
    // delete the file entry
    delete state.scannedDataByFileNew[key];
  } else {
    state.scannedDataByFileNew[key] = data;
  }
},
  setitemsScannedProduct: (state, action) => {
    const { data, fileName } = action.payload;
    if (!state.itemsScannedProduct) {
      state.itemsScannedProduct = {};
    }
    state.itemsScannedProduct[fileName] = data;
  },
 setPackingData: (state, action) => {
  const { fileName, data } = action.payload;
  if (!state.packingDataByFile || Array.isArray(state.packingDataByFile)) {
    state.packingDataByFile = {};
  }
  const key = normalizeFileName(fileName);

  if (data === null || typeof data === "undefined") {
    // remove any entries whose key starts with the provided base key
    for (const k of Object.keys(state.packingDataByFile)) {
      if (String(k).startsWith(key)) {
        delete state.packingDataByFile[k];
      }
    }
  } else {
    // set/replace the exact normalized key
    state.packingDataByFile[key] = data;
  }
},
setBoxList: (state, action) => {
  const { fileName, data } = action.payload;
  const base =
    state.BoxList && !Array.isArray(state.BoxList) ? state.BoxList : {};
  const key = normalizeFileName(fileName);
  if (data === null || typeof data === "undefined") {
    // ensure BoxList object exists then delete the key
    state.BoxList = { ...base };
    delete state.BoxList[key];
  } else {
    state.BoxList = {
      ...base,
      [key]: data,
    };
  }
},
  setBoxCode: (state, action) => {
  // Accepts { fileName, boxName, boxCodeNumber } OR { fileName, remove: true }
  const { fileName, boxName, boxCodeNumber, remove } = action.payload || {};
  if (!state.boxCode || Array.isArray(state.boxCode)) state.boxCode = {};
  const fileKey = fileName ? normalizeFileName(fileName) : "_global";

  if (remove) {
    // delete entire file entry
    delete state.boxCode[fileKey];
    return;
  }

  if (!state.boxCode[fileKey]) state.boxCode[fileKey] = {};

  // store as: state.boxCode[fileKey][boxName] = boxCodeNumber
  if (boxName == null) return;
  state.boxCode[fileKey][boxName] = boxCodeNumber;
},
    resetOutBoundState: () => initialStateScanner,
    resetScannedData: () =>   initialState.scannedDataByFileNew = {},
    localProduct:(state, action)=> {
      state.localProductDetails = action.payload
    },
    setProductSaved: (state, action)=> {
      state.productSavedSatus = action.payload
    },
    setProductScanDetails: (state, action) => {
      state.productScanDetailsRedux = action.payload;
    }

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
      .addCase(fetchOutBoundDeliveryCodes.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOutBoundDeliveryCodes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.deliveryCodes = action.payload ?? [];
      })
      .addCase(fetchOutBoundDeliveryCodes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error?.message;
      })
      .addCase(fetchFullRowByMatch.pending, (state) => {
        state.itemsScanningStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchFullRowByMatch.fulfilled, (state, action) => {
        state.itemsScanningStatus = 'succeeded';
        state.itemsScanning = action.payload ?? null;
      })
      .addCase(fetchFullRowByMatch.rejected, (state, action) => {
        state.itemsScanningStatus = 'failed';
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
      })
      .addCase(generatePdf.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(generatePdf.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload ?? [];
      })
      .addCase(generatePdf.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error?.message;
      })
      .addCase(saveProductScans.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(saveProductScans.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload ?? [];
      })
      .addCase(saveProductScans.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error?.message;
      });
  },
})

export const { clearOutBound, clearOutBoundDetails, setScannedData, setBoxList, setBoxCode, setPackingData, resetOutBoundState, setDeliveryCodes, setScannedDataNew, resetScannedData, localProduct,setProductSaved, setitemsScannedProduct, setProductScanDetails } = outBoundSlice.actions;

export const selectOutBound = (state) => {
  const slice = state?.outbound ?? {};
  console.log("sata ---", state)
  return {
    items: slice.items ?? [],
    status: slice.status ?? 'idle',
    error: slice.error ?? null,
    details: slice.details ?? null,
    detailsStatus: slice.detailsStatus ?? 'idle',
    itemsScanningStatus: slice.itemsScanningStatus ?? 'idle',
    detailsError: slice.detailsError ?? null,
    scannedDataByFile: slice.scannedDataByFile ?? {},
    packingDataByFile: slice.packingDataByFile ?? {},
    BoxList: slice.BoxList ?? [],
    boxCode: slice.boxCode ?? [],
    deliveryCodes: slice.deliveryCodes ?? [],
    itemsScanning: slice.itemsScanning ?? [],
    scannedDataByFileNew: slice.scannedDataByFileNew ?? {},
    localProductDetails: slice.localProductDetails ?? [],
    productSavedSatus: slice.productSavedSatus?? false,
    itemsScannedProduct: slice.itemsScannedProduct ?? {},
    productScanDetailsRedux: slice.productScanDetailsRedux ?? {},
  };
};

export default outBoundSlice.reducer;
// ...existing code...