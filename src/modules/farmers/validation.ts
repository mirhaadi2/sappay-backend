import { AppError } from '../../utils/AppError';

export const validateFarmerRegistration = (data: any) => {
    const { fullName, mobileNumber, village, district, password } = data || {};

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
        throw new AppError('ValidationError', 400, 'Full name is required');
    }

    if (!mobileNumber || !/^\d{10}$/.test(String(mobileNumber))) {
        throw new AppError('ValidationError', 400, 'A valid 10-digit mobile number is required');
    }

    if (!village || typeof village !== 'string' || village.trim().length < 2) {
        throw new AppError('ValidationError', 400, 'Village is required');
    }

    if (!district || typeof district !== 'string' || district.trim().length < 2) {
        throw new AppError('ValidationError', 400, 'District is required');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        throw new AppError('ValidationError', 400, 'Password must be at least 6 characters');
    }
};

export const validateFarmerLogin = (data: any) => {
    const { mobileNumber, password } = data || {};

    if (!mobileNumber || !/^\d{10}$/.test(String(mobileNumber))) {
        throw new AppError('ValidationError', 400, 'A valid 10-digit mobile number is required');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        throw new AppError('ValidationError', 400, 'Password must be at least 6 characters');
    }
};
