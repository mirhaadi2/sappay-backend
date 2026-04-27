import { Request, Response, NextFunction } from 'express';
import { createShipment } from '../../../integrations/delhivery/services';

export const handleCreateShipment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const shipmentPayload = {
            shipments: [
                {
                    name: req.body.customerName,
                    add: req.body.address,
                    pin: req.body.pincode,
                    city: req.body.city,
                    state: req.body.state,
                    country: "India",
                    phone: req.body.phone,
                    order: req.body.orderId,
                    payment_mode: req.body.isPrepaid ? "Prepaid" : "COD",
                    cod_amount: req.body.isPrepaid ? "0" : req.body.totalAmount,
                    quantity: req.body.totalItems,
                    shipment_width: "10",
                    shipment_height: "10",
                    weight: "500", // in grams
                    shipping_mode: "Surface"
                }
            ],
            pickup_location: {
                name: "SAPPEY FOODS PRIVATE LIMITED" // Your registered name
            }
        };

        const result = await createShipment(shipmentPayload);
        res.json({ success: true, result });
    } catch (error) {
        next(error);
    }
};