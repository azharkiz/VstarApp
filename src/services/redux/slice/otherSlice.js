import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';

// Example of a thunk action to fetch user data
export const fetchUserData = createAsyncThunk(
    'auth/fetchUserData',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(`/users/${userId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Example of a thunk action to update user data
export const updateUserData = createAsyncThunk(
    'auth/updateUserData',
    async ({ userId, userData }, { rejectWithValue }) => {
        try {
            const response = await apiClient.put(`/users/${userId}`, userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);