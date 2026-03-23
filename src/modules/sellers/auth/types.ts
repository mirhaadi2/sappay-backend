/**
 * Seller Authentication Types
 * Type definitions for seller authentication operations
 */

export interface SellerLoginCredentials {
  email: string;
  password: string;
}

export interface SellerRegisterCredentials {
  email: string;
  password: string;
  businessName: string;
  businessRegistrationNo: string;
  businessType: string;
  businessIdType: string;
  businessAddress: string;
  businessPhone: string;
  ownerName: string;
  ownerEmail: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  gstNumber?: string;
}

export interface SellerAuthResponse {
  success: boolean;
  data: {
    seller: {
      id: string;
      ownerEmail: string;
      ownerName: string;
      businessName: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    };
  };
}

export interface SellerProfileResponse {
  success: boolean;
  data: {
    seller: any; // Full seller profile
  };
}