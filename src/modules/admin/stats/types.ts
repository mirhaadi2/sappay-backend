/**
 * Admin Statistics Types
 * Structures for platform statistics and analytics
 */

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface PlatformStats {
  totalUsers: number;
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  mensualRevenue: number;
  mensualOrders: number;
  userGrowthTrend: ChartDataPoint[];
  orderTrend: ChartDataPoint[];
}

export interface StatsQueryParams {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}
