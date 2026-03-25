/**
 * Database Query Type Definitions
 * Ensures type-safe database operations
 */

import { QueryTypes } from 'sequelize';

export interface QueryResult<T> {
  data: T[];
  count: number;
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountedPrice?: number;
  discountedPercent?: number;
  sku?: string;
  weight?: number;
  gst_rate?: number;
  stock: string | number;
  category: string;
  categoryName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  images: string[];
  imageUrl?: string;
  variants?: Array<{ id: string; sku?: string; price: number; weight?: number; status?: 'ACTIVE' | 'INACTIVE' }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CountRow {
  count: string;
}
