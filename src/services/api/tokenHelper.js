import axios from 'axios';
import { store } from '../redux/rootRrducer'; // Adjust the import based on your store setup
import { refreshToken } from '../services/redux/slice/authSlice'; // Adjust the import based on your slice setup

const tokenHelper = {
    isTokenExpired: (token) => {
        if (!token) return true;
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        return Date.now() >= expirationTime;
    },

    refreshAccessToken: async () => {
        const state = store.getState();
        const refreshTokenValue = state.auth.refreshToken; // Adjust based on your state structure

        try {
            const response = await axios.post('/refresh-token', { token: refreshTokenValue });
            const { accessToken } = response.data;
            // Dispatch action to update the access token in the store
            store.dispatch(refreshToken(accessToken));
            return accessToken;
        } catch (error) {
            console.error('Failed to refresh token', error);
            throw error;
        }
    }
};

export default tokenHelper;