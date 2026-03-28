/**
 * Database Query Type Definitions
 * Ensures type-safe database operations
 */

import { QueryTypes } from 'sequelize';

export interface QueryResult<T> {
  data: T[];
  count: number;
}

export interface ProductVariantRow {
  id: string;
  sku?: string;
  price: number;
  weight?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  weight?: number;
  gst_rate?: number;
  stock: string | number;
  category: string;
  categoryName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isNew?: boolean;
  isCustomerFavourites?: boolean;
  isBestseller?: boolean;
  images: string[];
  imageUrl?: string;
  variantsCount?: number;
  variants?: ProductVariantRow[];
  sellerOfferings?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CountRow {
  count: string;
}
