import { Address, AddressType } from "./model";
import AddressRepository from "./repository";
import { AppError } from "../../utils/AppError";

export class AddressService {
  async createAddress(userId: string, addressData: {
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
  }) {
    // Validate phone number format (10 digits)
    if (!this.isValidPhone(addressData.phone)) {
      throw new AppError("ValidationError", 400, "Invalid phone number format. Must be 10 digits.");
    }

    // If setting as default, remove default from others
    if (addressData.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId, isDefault: true } }
      );
    }

    const address = await AddressRepository.create({
      userId,
      ...addressData,
    });

    return address;
  }

  async getAddressesByUserId(userId: string) {
    const addresses = await AddressRepository.findAllByUserId(userId);
    return addresses;
  }

  async getAddressById(id: string, userId: string) {
    const address = await AddressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new AppError("NotFoundError", 404, "Address not found");
    }
    return address;
  }

  async updateAddress(
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
  ) {
    // Verify address belongs to user
    const address = await AddressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new AppError("NotFoundError", 404, "Address not found");
    }

    // Validate phone if provided
    if (addressData.phone && !this.isValidPhone(addressData.phone)) {
      throw new AppError("ValidationError", 400, "Invalid phone number format. Must be 10 digits.");
    }

    const updatedAddress = await AddressRepository.update(id, userId, addressData);
    return updatedAddress;
  }

  async deleteAddress(id: string, userId: string) {
    const address = await AddressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new AppError("NotFoundError", 404, "Address not found");
    }

    const deleted = await AddressRepository.delete(id, userId);
    if (!deleted) {
      throw new AppError("InternalServerError", 500, "Failed to delete address");
    }

    return { message: "Address deleted successfully" };
  }

  async setDefaultAddress(id: string, userId: string) {
    const address = await AddressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new AppError("NotFoundError", 404, "Address not found");
    }

    const updated = await AddressRepository.setAsDefault(id, userId);
    return updated;
  }

  async getDefaultAddress(userId: string) {
    const address = await AddressRepository.findDefaultByUserId(userId);
    return address;
  }

  private isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");
    // Check if it has exactly 10 digits
    return digits.length === 10;
  }
}

export default new AddressService();
