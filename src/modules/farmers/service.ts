import { comparePassword, hashPassword } from '../../utils/password';
import { withTransaction } from '../../utils/transaction';
import { AppError } from '../../utils/AppError';
import { create, createBankDetails, createProduct, findByEmail, findByMobile, findById, update } from './repository';
import { FarmerRegisterInput, FarmerLoginInput } from './types';
import { FarmerStatus } from './model';

export const registerFarmerService = async (data: FarmerRegisterInput) => {
    return withTransaction(async (transaction) => {
        const { mobileNumber, email, password, fullName, village, district } = data;

        const existingMobile = await findByMobile(mobileNumber);
        if (existingMobile) {
            throw new AppError('Conflict', 409, 'A farmer with this mobile number already exists');
        }

        if (email) {
            const existingEmail = await findByEmail(email);
            if (existingEmail) {
                throw new AppError('Conflict', 409, 'A farmer with this email already exists');
            }
        }

        const hashedPassword = await hashPassword(password);

        const farmer = await create({
            fullName,
            mobileNumber,
            email: email || null,
            village,
            district,
            aadhaarNumber: data.aadhaarNumber || null,
            password: hashedPassword,
            status: FarmerStatus.APPROVED,
            metadata: { onboardingComplete: true },
        }, transaction);

        if (data.bankAccountHolderName || data.bankAccountNumber || data.bankIfscCode || data.bankName) {
            await createBankDetails(farmer.id, {
                accountHolderName: data.bankAccountHolderName || null,
                accountNumber: data.bankAccountNumber || null,
                ifscCode: data.bankIfscCode || null,
                bankName: data.bankName || null,
            }, transaction);
        }

        if (Array.isArray(data.products)) {
            for (const product of data.products) {
                if (!product?.name) continue;

                await createProduct(farmer.id, {
                    name: product.name,
                    category: product.category || 'general',
                    unit: product.unit || 'kg',
                    description: product.description || null,
                    pricePerUnit: typeof product.quantity === 'number' ? product.quantity : null,
                    isActive: true,
                }, transaction);
            }
        }

        return farmer;
    });
};

export const loginFarmerService = async (data: FarmerLoginInput) => {
    const farmer = await findByMobile(data.mobileNumber);
    if (!farmer) {
        throw new AppError('Unauthorized', 401, 'Invalid mobile number or password');
    }

    if (!farmer.password) {
        throw new AppError('Unauthorized', 401, 'Invalid mobile number or password');
    }

    const isValid = await comparePassword(data.password, farmer.password);
    if (!isValid) {
        throw new AppError('Unauthorized', 401, 'Invalid mobile number or password');
    }

    if (farmer.status === FarmerStatus.SUSPENDED) {
        throw new AppError('Forbidden', 403, 'Your farmer account has been suspended');
    }

    if (farmer.status === FarmerStatus.REJECTED) {
        throw new AppError('Forbidden', 403, 'Your farmer application has been rejected');
    }

    return farmer;
};

export const getFarmerProfileService = async (farmerId: string) => {
    const farmer = await findById(farmerId);
    if (!farmer) throw new AppError('NotFound', 404, 'Farmer not found');
    return farmer;
};

export const updateFarmerProfileService = async (farmerId: string, data: Partial<FarmerRegisterInput>) => {
    const farmer = await findById(farmerId);
    if (!farmer) throw new AppError('NotFound', 404, 'Farmer not found');

    return update(farmerId, data);
};
