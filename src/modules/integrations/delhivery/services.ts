import axios from 'axios';
import { config } from '../../../config';
import { Order, Shipment, ShipmentPackage } from '../../../models';

// Create a pre-configured instance for Delhivery
const delhiveryClient = axios.create({
  baseURL: config.delhivery.baseUrl,
  headers: {
    Authorization: `Token ${config.delhivery.token}`,
    'Content-Type': 'application/json',
  },
});

/** Check if a pincode is serviceable */
export const checkPincodeServiceability = async (pincode: string): Promise<any> => {
  try {
    const response = await delhiveryClient.get(`/c/api/pin-codes/json/`, {
      params: { filter_codes: pincode },
    });
    console.log('Delhivery API Response [checkPincode]:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Delhivery Service Error [checkPincode]:', error.response?.data || error.message);
    throw new Error('Could not verify serviceability with Delhivery');
  }
};

const formatWeight = (weight: any) => {
  const num = parseFloat(weight); // handles "300.00", "300.00 g", etc.
  return `${Math.round(num)}g`;
};

/** Example: Create Shipment (Function based)*/
export const createShipment = async (shipmentData: any): Promise<any> => {
  try {
    const products = Array.isArray(shipmentData.products) ? shipmentData.products : [];
    const totalQuantity = products.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
    const productsDesc =
      products.length > 0
        ? products
          .map((item: any) => {
            const name = item.name?.split('|')[0].trim(); // clean name
            const weight = formatWeight(item.weight); // keep simple (no "g" if possible)
            const qty = item.quantity || 1;
            const price = item.price;

            // return `${name}, ${weight}, ${qty}, ${price}`;
            return `${name}, ${weight} x ${qty}`;
          })
          .join(' | ')
        : 'Sappey Products';

    const shipmentPayload: any = {
      shipments: [
        {
          name: shipmentData.customerName,
          add: shipmentData.address,
          pin: shipmentData.pincode,
          city: shipmentData.city,
          state: shipmentData.state,
          country: "India",
          phone: shipmentData.phone,
          order: shipmentData.orderNumber,
          payment_mode: shipmentData.isPrepaid ? "Prepaid" : "COD",
          cod_amount: shipmentData.isPrepaid ? 0 : parseFloat(shipmentData.totalAmount),
          quantity: totalQuantity || shipmentData.totalItems,
          shipment_width: 10,
          shipment_height: 10,
          shipment_length: 10,
          products_desc: productsDesc,
          weight: parseInt(shipmentData?.weight) || 600,
          shipping_mode: "Surface"
        }
      ],
      pickup_location: {
        name: "Sappey foods private limited"
      }
    };

    const payload = `format=json&data=${encodeURIComponent(JSON.stringify(shipmentPayload))}`;
    const response = await delhiveryClient.post('/api/cmu/create.json', payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.data && response.data.packages && response.data.packages[0]) {
      console.log('Detailed Remarks from Delhivery:', response.data.packages[0].remarks);
    }
    if (response.data.packages?.length > 0) {
      const transaction = await Shipment.sequelize!.transaction();

      try {
        const shipment = await Shipment.create({
          orderId: shipmentData.orderId,
          uploadWbn: response.data.upload_wbn,
          courier: 'delhivery',
          status: 'CREATED',
          totalPackages: response?.data?.package_count || response?.data?.packages.length,
          totalCodAmount: parseFloat(response?.data?.cod_amount || 0),
          cashPickupsCount: response?.data?.cash_pickups_count || 0,
          packageCount: response?.data?.package_count || 0,
          prepaidCount: response?.data?.prepaid_count || 0,
          pickupsCount: response?.data?.pickups_count || 0,
          replacementCount: response?.data?.replacement_count || 0,
          cashPickups: parseFloat(response?.data?.cash_pickups || 0),
          codAmount: parseFloat(response?.data?.cod_amount || 0),
          codCount: response?.data?.cod_count || 0,
          metadata: {
            originalResponse: response?.data,
            createdVia: 'admin-portal'
          }
        }, { transaction });

        const packagePromises = response?.data?.packages.map((pkg: any) =>
          ShipmentPackage.create({
            shipmentId: shipment.id,
            waybill: pkg.waybill,
            refnum: pkg.refnum,
            client: pkg.client,
            payment: pkg.payment,
            codAmount: parseFloat(pkg.cod_amount || 0),
            status: pkg.status || 'Success',
            sortCode: pkg.sort_code,
            serviceable: pkg.serviceable !== false,
            remarks: Array.isArray(pkg.remarks) ? pkg.remarks : [],
            metadata: {
              originalPackageData: pkg
            }
          }, { transaction })
        );

        await Promise.all(packagePromises);

        const primaryWaybill = response?.data?.packages[0]?.waybill;
        if (primaryWaybill) {
          await Order.update(
            {
              trackingNumber: primaryWaybill,
              status: 'HANDOVER'
            },
            {
              where: { id: shipmentData.orderId },
              transaction
            }
          );
        }

        await transaction.commit();

      } catch (dbError) {
        await transaction.rollback();
        console.error('Database error while saving shipment:', dbError);
      }
    }

    return response.data;
  } catch (error: any) {
    console.error('Delhivery Service Error [createShipment]:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data,
      fullError: error
    });

    if (error.message && error.message.includes('JSON')) {
      throw new Error(`Delhivery API returned invalid JSON response. Status: ${error.response?.status}, Response: ${error.response?.data}`);
    }

    throw new Error('Shipment creation failed');
  }
};

/** Example: Track Shipment (Function based)*/
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

/** Edit Shipment (Create/Update) POST /api/p/edit*/
export const editShipment = async (shipmentData: any): Promise<any> => {
  try {
    const response = await delhiveryClient.post('/api/p/edit', shipmentData);
    return response.data;
  } catch (error: any) {
    console.error('Delhivery Service Error [editShipment]:', error.response?.data || error.message);
    throw new Error('Shipment edit failed');
  }
};

/** Cancel Shipment POST /api/p/edit with cancellation: true */
export const cancelShipment = async (waybill: string): Promise<any> => {
  try {
    const response = await delhiveryClient.post('/api/p/edit', {
      waybill,
      cancellation: 'true'
    });
    return response.data;
  } catch (error: any) {
    console.error('Delhivery Service Error [cancelShipment]:', error.response?.data || error.message);
    throw new Error('Shipment cancellation failed');
  }
};

/** Update E-waybill PUT /api/rest/ewaybill/{waybill} */
export const updateEwaybill = async (waybill: string, data: any): Promise<any> => {
  try {
    const response = await delhiveryClient.put(`/api/rest/ewaybill/${waybill}/`, { data });
    return response.data;
  } catch (error: any) {
    console.error('Delhivery Service Error [updateEwaybill]:', error.response?.data || error.message);
    throw new Error('E-waybill update failed');
  }
};

/** Calculate Shipping Charges GET /api/kinko/v1/invoice/charges/.json */
export const calculateCharges = async (params: any): Promise<any> => {
  try {
    const response = await delhiveryClient.get('/api/kinko/v1/invoice/charges/.json', {
      params,
    });
    return response.data;
  } catch (error: any) {
    console.error('Delhivery Service Error [calculateCharges]:', error.response?.data || error.message);
    throw new Error('Charges calculation failed');
  }
};

/** Generate Packing Slip GET /api/p/packing_slip */
export const generatePackingSlip = async (wbns: string, pdf: boolean = true, pdfSize: string = '4R'): Promise<any> => {
  try {
    const response = await delhiveryClient.get('/api/p/packing_slip', {
      params: { wbns, pdf, pdf_size: pdfSize },
      responseType: pdf ? 'arraybuffer' : 'json',
    });

    if (pdf) {
      const contentTypeRaw = response.headers['content-type'] ?? '';
      const contentType = Array.isArray(contentTypeRaw) ? contentTypeRaw.join(';') : String(contentTypeRaw);
      const buffer = Buffer.from(response.data as ArrayBuffer);

      const looksLikeJson = contentType.includes('application/json') || buffer.slice(0, 1).toString() === '{';
      if (looksLikeJson) {
        const jsonText = buffer.toString('utf8');
        const json = JSON.parse(jsonText);
        const pdfLink = json?.pdf_download_link || json?.packages?.[0]?.pdf_download_link;

        if (pdfLink) {
          const pdfResponse = await axios.get(pdfLink, {
            responseType: 'arraybuffer',
          });
          return Buffer.from(pdfResponse.data as ArrayBuffer);
        }

        console.error('Delhivery Service Error [generatePackingSlip] JSON payload had no pdf_download_link:', json);
        throw new Error('Packing slip API returned JSON without a PDF download link');
      }

      return buffer;
    }

    return response.data;
  } catch (error: any) {
    console.error('Delhivery Service Error [generatePackingSlip]:', error.response?.data || error.message);
    throw new Error('Packing slip generation failed');
  }
};

/** Create Pickup Request POST /fm/request/new/ */
export const createPickupRequest = async (pickupData: any): Promise<any> => {
  try {
    const response = await delhiveryClient.post('/fm/request/new/', pickupData);
    return response.data;
  } catch (error: any) {
    console.error('Delhivery Service Error [createPickupRequest]:', error.response?.data || error.message);
    throw new Error('Pickup request creation failed');
  }
};