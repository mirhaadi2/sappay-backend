/**
 * Seller Products Transformer
 * Response formatting utilities for seller product operations
 */

import { SellerProduct } from '../../admin/products/seller-product/model';
import { SellerProductListItem } from './types';

/**
 * Transform seller product for API response
 */
export const transformSellerProduct = (sellerProduct: SellerProduct) => {
  return {
    id: sellerProduct.id,
    productId: sellerProduct.productId,
    sellerId: sellerProduct.sellerId,
    sellerPrice: sellerProduct.sellerPrice,
    costPrice: sellerProduct.costPrice,
    discountedPrice: sellerProduct.discountedPrice,
    discountedPercent: sellerProduct.discountedPercent,
    rating: sellerProduct.rating,
    ratingCount: sellerProduct.ratingCount,
    status: sellerProduct.status,
    createdAt: sellerProduct.createdAt,
    updatedAt: sellerProduct.updatedAt,
  };
};

/**
 * Transform seller products list for API response
 */
export const transformSellerProductsList = (products: any[]): SellerProductListItem[] => {
  return products.map(product => ({
    sellerProductId: product.sellerProductId,
    productId: product.productId,
    name: product.name,
    slug: product.slug,
    images: product.images,
    categoryId: product.categoryId,
    sellerPrice: product.sellerPrice,
    costPrice: product.costPrice,
    discountedPrice: product.discountedPrice,
    discountedPercent: product.discountedPercent,
    rating: product.rating,
    ratingCount: product.ratingCount,
    availableStock: product.availableStock,
    status: product.status,
  }));
};

/**
 * Transform seller product with inventory for API response
 */
export const transformSellerProductWithInventory = (sellerProduct: SellerProduct, inventory?: any) => {
  return {
    ...transformSellerProduct(sellerProduct),
    inventory: inventory ? {
      availableStock: inventory.availableStock,
      reservedStock: inventory.reservedStock,
      totalStock: inventory.availableStock + inventory.reservedStock,
    } : null,
  };
};