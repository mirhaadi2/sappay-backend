import { Request, Response, NextFunction } from "express";
import {
  createAddressService,
  getAddressByIdService,
  updateAddressService,
  deleteAddressService,
  setDefaultAddressService,
  getDefaultAddressService,
  getAddressesByCustomerIdService,
} from "./service";
import { AppError } from "../../../utils/AppError";
import { AddressType } from "../../admin/address/model";

export const createAddressHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.session?.user?.id;
    if (!customerId) {
      throw new AppError("UnauthorizedError", 401, "Customer not authenticated");
    }

    const { type, name, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = req.body;

    if (!addressLine1 || !city || !state || !postalCode || !country || !phone) {
      throw new AppError("ValidationError", 400, "Missing required fields");
    }

    if (type && !Object.values(AddressType).includes(type)) {
      throw new AppError("ValidationError", 400, "Invalid address type");
    }

    const address = await createAddressService(customerId, {
      type: type || AddressType.HOME,
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault: isDefault || false,
    });

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

export const getAddressesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.session?.user?.id;
    if (!customerId) {
      throw new AppError("UnauthorizedError", 401, "Customer not authenticated");
    }

    const addresses = await getAddressesByCustomerIdService(customerId);

    res.status(200).json({
      success: true,
      data: addresses,
      count: addresses.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getAddressByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.session?.user?.id;
    if (!customerId) {
      throw new AppError("UnauthorizedError", 401, "Customer not authenticated");
    }

    const { id } = req.params;
    const address = await getAddressByIdService(id, customerId);

    res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddressHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.session?.user?.id;
    if (!customerId) {
      throw new AppError("UnauthorizedError", 401, "Customer not authenticated");
    }

    const { id } = req.params;
    const { type, name, addressLine1, addressLine2, city, state, postalCode, country, phone } = req.body;

    if (type && !Object.values(AddressType).includes(type)) {
      throw new AppError("ValidationError", 400, "Invalid address type");
    }

    const updateData: any = {};
    if (type) updateData.type = type;
    if (name !== undefined) updateData.name = name;
    if (addressLine1) updateData.addressLine1 = addressLine1;
    if (addressLine2) updateData.addressLine2 = addressLine2;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (postalCode) updateData.postalCode = postalCode;
    if (country) updateData.country = country;
    if (phone) updateData.phone = phone;

    const address = await updateAddressService(id, customerId, updateData);

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddressHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.session?.user?.id;
    if (!customerId) {
      throw new AppError("UnauthorizedError", 401, "Customer not authenticated");
    }

    const { id } = req.params;
    const result = await deleteAddressService(id, customerId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddressHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.session?.user?.id;
    if (!customerId) {
      throw new AppError("UnauthorizedError", 401, "Customer not authenticated");
    }

    const { id } = req.params;
    const address = await setDefaultAddressService(id, customerId);

    res.status(200).json({
      success: true,
      message: "Default address set successfully",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

export const getDefaultAddressHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.session?.user?.id;
    if (!customerId) {
      throw new AppError("UnauthorizedError", 401, "Customer not authenticated");
    }

    const address = await getDefaultAddressService(customerId);

    if (!address) {
      throw new AppError("NotFoundError", 404, "No default address found");
    }

    res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    next(error);
  }
};
