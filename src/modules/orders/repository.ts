import { default as Order } from './order.model';
import { OrderItem } from './order-item.model';
import { AppError } from '../../utils/AppError';

export const createOrder = async (data: any) => {
  return await Order.create(data);
};

export const findOrderById = async (id: string) => {
  return await Order.findByPk(id);
};

export const findOrderByNumber = async (orderNumber: string) => {
  return await Order.findOne({ where: { orderNumber } });
};

export const findCustomerOrders = async (customerId: string, filters: any = {}) => {
  const { limit = 20, offset = 0, status } = filters;
  const where: any = { customerId };
  if (status) where.status = status;

  return await Order.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
};

export const updateOrder = async (id: string, data: any) => {
  const order = await findOrderById(id);
  if (!order) throw new AppError('NotFound', 404, 'Order not found');
  return await order.update(data);
};

export const updateOrderStatus = async (id: string, status: string) => {
  const order = await findOrderById(id);
  if (!order) throw new AppError('NotFound', 404, 'Order not found');
  return await order.update({ status: status as any });
};

export const createOrderItem = async (data: any) => {
  return await OrderItem.create(data);
};

export const findOrderItems = async (orderId: string) => {
  return await OrderItem.findAll({ where: { orderId } });
};

export const updateOrderItem = async (id: string, data: any) => {
  const item = await OrderItem.findByPk(id);
  if (!item) throw new AppError('NotFound', 404, 'Order item not found');
  return await item.update(data);
};

export const getSellerOrderItems = async (sellerId: string, filters: any = {}) => {
  const { limit = 20, offset = 0, status } = filters;
  const where: any = { sellerId };
  if (status) where.status = status;

  return await OrderItem.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
};

export const generateOrderNumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `ORD${dateStr}${random}`;
};
