import { Address, AddressType } from "./model";
import { Op } from "sequelize";

export class AddressRepository {
  async create(addressData: {
    userId: string;
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
    return await Address.create({
      ...addressData,
      isDefault: addressData.isDefault || false,
    });
  }

  async findByIdAndUserId(id: string, userId: string) {
    return await Address.findOne({
      where: { id, userId },
    });
  }

  async findAllByUserId(userId: string) {
    return await Address.findAll({
      where: { userId },
      order: [["isDefault", "DESC"], ["createdAt", "DESC"]],
    });
  }

  async findDefaultByUserId(userId: string) {
    return await Address.findOne({
      where: { userId, isDefault: true },
    });
  }

  async update(
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
    const address = await this.findByIdAndUserId(id, userId);
    if (!address) return null;

    return await address.update(addressData);
  }

  async delete(id: string, userId: string) {
    const address = await this.findByIdAndUserId(id, userId);
    if (!address) return false;

    await address.destroy();
    return true;
  }

  async setAsDefault(id: string, userId: string) {
    // Remove default from all other addresses
    await Address.update(
      { isDefault: false },
      {
        where: { userId, isDefault: true },
      }
    );

    // Set this address as default
    const address = await this.findByIdAndUserId(id, userId);
    if (!address) return null;

    return await address.update({ isDefault: true });
  }

  async deleteAllByUserId(userId: string) {
    return await Address.destroy({
      where: { userId },
    });
  }

  async countByUserId(userId: string) {
    return await Address.count({
      where: { userId },
    });
  }
}

export default new AddressRepository();
