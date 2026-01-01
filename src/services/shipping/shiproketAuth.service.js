import axios from 'axios';
import { SHIPROCKET_BASE_URL, SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD } from '../../../config/env.js';
let shiprocketToken = null;
export const getShiprocketAuthToken = async () => {
    try {
        const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
            email: SHIPROCKET_EMAIL,
            password: SHIPROCKET_PASSWORD
        });
        shiprocketToken = response.data.token;
        return shiprocketToken;
    } catch (error) {
        console.error('Error fetching Shiprocket auth token:', error);
        throw error;
    } 
};