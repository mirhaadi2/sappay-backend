import { Address, AddressType } from "./model";
import {
  create,
  findAllByUserId,
  findByIdAndUserId,
  update,
  deleteAddress,
  setAsDefault,
  findDefaultByUserId,
} from "./repository";
import { AppError } from "../../utils/AppError";

const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
};

export const createAddressService = async (
  userId: string,
  addressData: {
    type: AddressType;
    name?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    isDefault?: boolean;
  }
) => {
  if (!isValidPhone(addressData.phone)) {
    throw new AppError("ValidationError", 400, "Invalid phone number format. Must be 10 digits.");
  }

  if (addressData.isDefault) {
    await Address.update(
      { isDefault: false },
      { where: { userId, isDefault: true } }
    );
  }

  const address = await create({
    userId,
    ...addressData,
  });

  return address;
};

export const getAddressesByUserIdService = async (userId: string) => {
  const addresses = await findAllByUserId(userId);
  return addresses;
};

export const getAddressByIdService = async (id: string, userId: string) => {
  const address = await findByIdAndUserId(id, userId);
  if (!address) {
    throw new AppError("NotFoundError", 404, "Address not found");
  }
  return address;
};

export const updateAddressService = async (
  id: string,
  userId: string,
  addressData: Partial<{
    type: AddressType;
    name?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  }>
) => {
  const address = await findByIdAndUserId(id, userId);
  if (!address) {
    throw new AppError("NotFoundError", 404, "Address not found");
  }

  if (addressData.phone && !isValidPhone(addressData.phone)) {
    throw new AppError("ValidationError", 400, "Invalid phone number format. Must be 10 digits.");
  }

  const updatedAddress = await update(id, userId, addressData);
  return updatedAddress;
};

export const deleteAddressService = async (id: string, userId: string) => {
  const address = await findByIdAndUserId(id, userId);
  if (!address) {
    throw new AppError("NotFoundError", 404, "Address not found");
  }

  const deleted = await deleteAddress(id, userId);
  if (!deleted) {
    throw new AppError("InternalServerError", 500, "Failed to delete address");
  }

  return { message: "Address deleted successfully" };
};

export const setDefaultAddressService = async (id: string, userId: string) => {
  const address = await findByIdAndUserId(id, userId);
  if (!address) {
    throw new AppError("NotFoundError", 404, "Address not found");
  }

  const updated = await setAsDefault(id, userId);
  return updated;
};

export const getDefaultAddressService = async (userId: string) => {
  const address = await findDefaultByUserId(userId);
  return address;
};
