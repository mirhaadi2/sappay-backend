import axios from 'axios';
import { config } from '../../../config';

// Create a pre-configured instance for Delhivery
const delhiveryClient = axios.create({
  baseURL: 'https://track.delhivery.com',
  headers: {
    Authorization: `Token ${config.delhivery.token}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Check if a pincode is serviceable
 */
export const checkPincodeServiceability = async (pincode: string): Promise<any> => {
  try {
    const response = await delhiveryClient.get(`/c/api/pin-codes/json/`, {
      params: { filter_codes: pincode },
    });
    return response.data;
  } catch (error: any) {
    console.error('Delhivery Service Error [checkPincode]:', error.response?.data || error.message);
    throw new Error('Could not verify serviceability with Delhivery');
  }
};

/**
 * Example: Create Shipment (Function based)
 */
export const createShipment = async (shipmentData: any): Promise<any> => {
  try {
    const response = await delhiveryClient.post('/api/cmu/create.json', shipmentData);
    return response.data;
  } catch (error: any) {
     throw new Error('Shipment creation failed');
  }
};