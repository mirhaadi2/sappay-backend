import { Request, Response, NextFunction } from "express";
import {
  checkPincodeServiceability,
  createShipment,
  trackShipmentService,
  editShipment,
  cancelShipment,
  updateEwaybill,
  calculateCharges,
  generatePackingSlip,
  createPickupRequest,
} from "./services";
import { AppError } from "../../utils/AppError";

/** Handler for GET /api/pincode/:pincode */
export const checkPincode = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { pincode } = req.params;

    // Simple validation
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      res.status(400).json({
        success: false,
        message: "Invalid pincode. Must be a 6-digit number.",
      });
      return;
    }

    const data = await checkPincodeServiceability(pincode);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const trackShipment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { waybill } = req.params;
    if (!waybill) {
      throw new AppError("ValidationErrror", 400, "Waybill number is required");
    }

    const trackingData = await trackShipmentService(waybill);
    res.status(200).json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    next(error);
  }
};

/** Handler for POST /api/delhivery/shipment/edit */
export const editShipmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const shipmentData = req.body;
    if (!shipmentData || !shipmentData.waybill) {
      throw new AppError("ValidationError", 400, "Waybill is required");
    }

    const data = await editShipment(shipmentData);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/** Handler for POST /api/delhivery/shipment/cancel */
export const cancelShipmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { waybill } = req.body;
    if (!waybill) {
      throw new AppError("ValidationError", 400, "Waybill is required");
    }

    const data = await cancelShipment(waybill);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/** Handler for PUT /api/delhivery/ewaybill/:waybill */
export const updateEwaybillHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { waybill } = req.params;
    const updateData = req.body;
    if (!waybill) {
      throw new AppError("ValidationError", 400, "Waybill is required");
    }

    const data = await updateEwaybill(waybill, updateData);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/** Handler for GET /api/delhivery/charges */
export const calculateChargesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const params = req.query;
    const data = await calculateCharges(params);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/** Handler for GET /api/delhivery/packing-slip */
export const generatePackingSlipHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { wbns, pdf, pdf_size } = req.query;
    if (!wbns) {
      throw new AppError(
        "ValidationError",
        400,
        "Waybill numbers are required",
      );
    }

    const data = await generatePackingSlip(
      wbns as string,
      pdf === "true",
      pdf_size as string,
    );
    if (pdf === "true") {
      const pdfBuffer = Buffer.isBuffer(data)
        ? data
        : Buffer.from(data as ArrayBuffer);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=packing-slip-${wbns}.pdf`,
      );
      res.setHeader("Content-Length", pdfBuffer.length.toString());
      res.send(pdfBuffer);
    } else {
      res.status(200).json({
        success: true,
        data,
      });
    }
  } catch (error) {
    next(error);
  }
};

/** Handler for POST /api/delhivery/pickup */
export const createPickupRequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const pickupData = req.body;
    if (
      !pickupData ||
      !pickupData.pickup_date ||
      !pickupData.pickup_time ||
      !pickupData.pickup_location
    ) {
      throw new AppError(
        "ValidationError",
        400,
        "Pickup date, time, and location are required",
      );
    }

    const data = await createPickupRequest(pickupData);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
