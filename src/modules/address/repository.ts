import { Address, AddressType } from "./model";
import { Op } from "sequelize";

export const create = async (addressData: {
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
}) => {
  return await Address.create({
    ...addressData,
    isDefault: addressData.isDefault || false,
  });
};

export const findByIdAndUserId = async (id: string, userId: string) => {
  return await Address.findOne({
    where: { id, userId },
  });
};

export const findAllByUserId = async (userId: string) => {
  return await Address.findAll({
    where: { userId },
    order: [["isDefault", "DESC"], ["createdAt", "DESC"]],
  });
};

export const findDefaultByUserId = async (userId: string) => {
  return await Address.findOne({
    where: { userId, isDefault: true },
  });
};

export const update = async (
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
  if (!address) return null;

  return await address.update(addressData);
};

export const deleteAddress = async (id: string, userId: string) => {
  const address = await findByIdAndUserId(id, userId);
  if (!address) return false;

  await address.destroy();
  return true;
};

export const setAsDefault = async (id: string, userId: string) => {
  await Address.update(
    { isDefault: false },
    {
      where: { userId, isDefault: true },
    }
  );

  const address = await findByIdAndUserId(id, userId);
  if (!address) return null;

  return await address.update({ isDefault: true });
};

export const deleteAllByUserId = async (userId: string) => {
  return await Address.destroy({
    where: { userId },
  });
};

export const countByUserId = async (userId: string) => {
  return await Address.count({
    where: { userId },
  });
};
