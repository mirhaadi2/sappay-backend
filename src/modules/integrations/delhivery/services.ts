import axios from 'axios';
import { config } from '../../../config';

// Create a pre-configured instance for Delhivery
const delhiveryClient = axios.create({
  baseURL: config.delhivery.baseUrl,
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
    // 1. Prepare the specific payload Delhivery expects
    const params = new URLSearchParams();
    params.append('format', 'json');
    params.append('data', JSON.stringify(shipmentData));

    // 2. We override the Content-Type header just for this call
    const response = await delhiveryClient.post('/api/cmu/create.json', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Delhivery Service Error [createShipment]:', error.response?.data || error.message);
    throw new Error('Shipment creation failed');
  }
};

/**
 * Track Shipment
 * GET request - useful for order status pages
 */
export const trackShipmentService = async (waybill: string): Promise<any> => {
  try {
    const response = await delhiveryClient.get(`/api/v1/packages/json/`, {
      params: { waybill },
    });
    return response.data;
  } catch (error: any) {
    console.error('Delhivery Service Error [trackShipment]:', error.response?.data || error.message);
    throw new Error('Tracking request failed');
  }
};