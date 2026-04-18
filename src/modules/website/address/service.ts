import { Address, AddressType } from "../../admin/address/model";
import {
  create,
  findAllByCustomerId,
  findByIdAndCustomerId,
  update,
  deleteAddress,
  setAsDefault,
  findDefaultByCustomerId,
} from "./repository";
import { AppError } from "../../../utils/AppError";

const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
};

export const createAddressService = async (
  customerId: string,
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
      { where: { customerId, isDefault: true } }
    );
  }

  const address = await create({
    customerId,
    ...addressData,
  });

  return address;
};

export const getAddressesByCustomerIdService = async (customerId: string) => {
  const addresses = await findAllByCustomerId(customerId);
  return addresses;
};

export const getAddressByIdService = async (id: string, customerId: string) => {
  const address = await findByIdAndCustomerId(id, customerId);
  if (!address) {
    throw new AppError("NotFoundError", 404, "Address not found");
  }
  return address;
};

export const updateAddressService = async (
  id: string,
  customerId: string,
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
  const address = await findByIdAndCustomerId(id, customerId);
  if (!address) {
    throw new AppError("NotFoundError", 404, "Address not found");
  }

  if (addressData.phone && !isValidPhone(addressData.phone)) {
    throw new AppError("ValidationError", 400, "Invalid phone number format. Must be 10 digits.");
  }

  const updatedAddress = await update(id, customerId, addressData);
  return updatedAddress;
};

export const deleteAddressService = async (id: string, customerId: string) => {
  const address = await findByIdAndCustomerId(id, customerId);
  if (!address) {
    throw new AppError("NotFoundError", 404, "Address not found");
  }

  const deleted = await deleteAddress(id, customerId);
  if (!deleted) {
    throw new AppError("InternalServerError", 500, "Failed to delete address");
  }

  return { message: "Address deleted successfully" };
};

export const setDefaultAddressService = async (id: string, customerId: string) => {
  const address = await findByIdAndCustomerId(id, customerId);
  if (!address) {
    throw new AppError("NotFoundError", 404, "Address not found");
  }

  const updated = await setAsDefault(id, customerId);
  return updated;
};

export const getDefaultAddressService = async (customerId: string) => {
  const address = await findDefaultByCustomerId(customerId);
  return address;
};
