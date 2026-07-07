export interface FarmerRegisterInput {
    fullName: string;
    mobileNumber: string;
    email?: string;
    village: string;
    district: string;
    aadhaarNumber?: string;
    password: string;
    bankAccountHolderName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankName?: string;
    products?: Array<{
        name: string;
        quantity?: number | string;
        unit?: string;
        category?: string;
        description?: string;
    }>;
}

export interface FarmerLoginInput {
    mobileNumber: string;
    password: string;
}
