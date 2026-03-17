import { Inventory } from './inventory.model';
import { AppError } from '../../utils/AppError';

export const createInventory = async (data: any) => {
  return await Inventory.create(data);
};

export const findBySellerProductId = async (sellerProductId: string) => {
  return await Inventory.findOne({ where: { sellerProductId } });
};

export const updateInventory = async (id: string, data: any) => {
  const inventory = await Inventory.findByPk(id);
  if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');
  return await inventory.update(data);
};

export const getSellerInventory = async (sellerId: string, filters: any = {}) => {
  return { rows: [], count: 0 };
};

export const decrementStock = async (sellerProductId: string, quantity: number) => {
  const inventory = await findBySellerProductId(sellerProductId);
  if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

  if (inventory.availableStock < quantity) {
    throw new AppError('BadRequest', 400, 'Insufficient stock');
  }

  return await inventory.update({
    availableStock: inventory.availableStock - quantity,
    soldStock: inventory.soldStock + quantity,
  });
};

export const reserveStockRepo = async (sellerProductId: string, quantity: number) => {
  const inventory = await findBySellerProductId(sellerProductId);
  if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

  if (inventory.availableStock < quantity) {
    throw new AppError('BadRequest', 400, 'Insufficient stock');
  }

  return await inventory.update({
    availableStock: inventory.availableStock - quantity,
    reservedStock: inventory.reservedStock + quantity,
  });
};

export const releaseReservedStock = async (sellerProductId: string, quantity: number) => {
  const inventory = await findBySellerProductId(sellerProductId);
  if (!inventory) throw new AppError('NotFound', 404, 'Inventory not found');

  return await inventory.update({
    availableStock: inventory.availableStock + quantity,
    reservedStock: inventory.reservedStock - quantity,
  });
};
