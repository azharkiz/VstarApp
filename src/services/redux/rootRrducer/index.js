import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from '../slice/authSlice';
import outBoundReducer from '../slice/outBoundSlice';

// debug imports
// console.log('authReducer OK:', typeof authReducer !== 'undefined');
// console.log('outBoundReducer OK:', typeof outBoundReducer !== 'undefined');

const reducers = {
  auth: authReducer,
};

// only attach outbound if the import resolved
if (outBoundReducer) {
  reducers.outbound = outBoundReducer;
} else {
  console.warn(
    "outBoundReducer is undefined. Check src/services/redux/slice/outBoundSlice.js default export and import path."
  );
}

const rootReducer = combineReducers(reducers);

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'outbound'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

const persistor = persistStore(store);

export { store, persistor };