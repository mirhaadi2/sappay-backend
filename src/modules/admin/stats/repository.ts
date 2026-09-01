import { Op, fn, col } from 'sequelize';
import { User } from '../../admin/customers/models';
import { Seller, SellerStatus } from '../../sellers/model';
import { Order } from '../orders/order.model';
import { Product } from '../products/model';
import { ChartDataPoint } from './types';

type AggregateRow = { count?: string | number; total?: string | number; [key: string]: any };

export const getTotalUsersCount = async (): Promise<AggregateRow | null> =>
    User.findOne({
        attributes: [[fn('COUNT', col('*')), 'count']],
        raw: true,
    }) as Promise<AggregateRow | null>;

export const getApprovedSellerCount = async (): Promise<AggregateRow | null> =>
    Seller.findOne({
        attributes: [[fn('COUNT', col('*')), 'count']],
        where: { status: SellerStatus.APPROVED },
        raw: true,
    }) as Promise<AggregateRow | null>;

export const getTotalOrderCount = async (): Promise<AggregateRow | null> =>
    Order.findOne({
        attributes: [[fn('COUNT', col('*')), 'count']],
        raw: true,
    }) as Promise<AggregateRow | null>;

export const getActiveProductCount = async (): Promise<AggregateRow | null> =>
    Product.findOne({
        attributes: [[fn('COUNT', col('*')), 'count']],
        where: { status: 'ACTIVE' },
        raw: true,
    }) as Promise<AggregateRow | null>;

export const getRevenueSummary = async (monthStart: Date, monthEnd: Date) => {
    const [totalRevenueResult, monthlyRevenueResult, monthlyOrdersResult] = await Promise.all([
        Order.findOne({
            attributes: [
                [fn('SUM', col('final_amount')), 'total'],
                [fn('COUNT', col('id')), 'count'],
            ],
            where: { paymentStatus: 'COMPLETED' },
            raw: true,
        }) as Promise<AggregateRow | null>,
        Order.findOne({
            attributes: [[fn('SUM', col('final_amount')), 'total']],
            where: {
                paymentStatus: 'COMPLETED',
                createdAt: {
                    [Op.between]: [monthStart, monthEnd],
                },
            },
            raw: true,
        }) as Promise<AggregateRow | null>,
        Order.findOne({
            attributes: [[fn('COUNT', col('id')), 'count']],
            where: {
                createdAt: {
                    [Op.between]: [monthStart, monthEnd],
                },
            },
            raw: true,
        }) as Promise<AggregateRow | null>,
    ]);

    return {
        totalRevenue: totalRevenueResult?.total ? parseFloat(String(totalRevenueResult.total)) : 0,
        monthlyRevenue: monthlyRevenueResult?.total
            ? parseFloat(String(monthlyRevenueResult.total))
            : 0,
        monthlyOrders: monthlyOrdersResult?.count
            ? parseInt(String(monthlyOrdersResult.count), 10)
            : 0,
    };
};

export const generateTrendDataFromDB = async (
    model: any,
    days: number = 30,
    dateField: string = 'createdAt',
): Promise<ChartDataPoint[]> => {
    const data: ChartDataPoint[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    try {
        const results = await model.findAll({
            attributes: [
                [fn('DATE', col(dateField)), 'date'],
                [fn('COUNT', col('id')), 'count'],
            ],
            where: {
                [dateField]: {
                    [Op.between]: [startDate, today],
                },
            },
            group: [fn('DATE', col(dateField))],
            order: [[fn('DATE', col(dateField)), 'ASC']],
            raw: true,
            subQuery: false,
        });

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const record = results.find((r: any) => r.date === dateStr);

            data.push({
                date: dateStr,
                value: record ? parseInt(String(record.count), 10) : 0,
            });
        }

        return data;
    } catch (error) {
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toISOString().split('T')[0],
                value: 0,
            });
        }
        return data;
    }
};
