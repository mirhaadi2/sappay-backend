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
  stock: string | number;
  category: string;
  status: 'ACTIVE' | 'INACTIVE';
  images: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CountRow {
  count: string;
}
