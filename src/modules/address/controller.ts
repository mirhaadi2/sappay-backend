import { Request, Response, NextFunction } from "express";
import AddressService from "./service";
import { AppError } from "../../utils/AppError";
import { AddressType } from "./model";

export class AddressController {
  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError("UnauthorizedError", 401, "User not authenticated");
      }

      const { type, name, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = req.body;

      // Validate required fields
      if (!addressLine1 || !city || !state || !postalCode || !country || !phone) {
        throw new AppError("ValidationError", 400, "Missing required fields");
      }

      // Validate address type
      if (type && !Object.values(AddressType).includes(type)) {
        throw new AppError("ValidationError", 400, "Invalid address type");
      }

      const address = await AddressService.createAddress(req.user.id, {
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
  }

  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError("UnauthorizedError", 401, "User not authenticated");
      }

      const addresses = await AddressService.getAddressesByUserId(req.user.id);

      res.status(200).json({
        success: true,
        data: addresses,
        count: addresses.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAddressById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError("UnauthorizedError", 401, "User not authenticated");
      }

      const { id } = req.params;
      const address = await AddressService.getAddressById(id, req.user.id);

      res.status(200).json({
        success: true,
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError("UnauthorizedError", 401, "User not authenticated");
      }

      const { id } = req.params;
      const { type, name, addressLine1, addressLine2, city, state, postalCode, country, phone } = req.body;

      // Validate address type if provided
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

      const address = await AddressService.updateAddress(id, req.user.id, updateData);

      res.status(200).json({
        success: true,
        message: "Address updated successfully",
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError("UnauthorizedError", 401, "User not authenticated");
      }

      const { id } = req.params;
      const result = await AddressService.deleteAddress(id, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async setDefaultAddress(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError("UnauthorizedError", 401, "User not authenticated");
      }

      const { id } = req.params;
      const address = await AddressService.setDefaultAddress(id, req.user.id);

      res.status(200).json({
        success: true,
        message: "Default address set successfully",
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDefaultAddress(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError("UnauthorizedError", 401, "User not authenticated");
      }

      const address = await AddressService.getDefaultAddress(req.user.id);

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
  }
}

export default new AddressController();
