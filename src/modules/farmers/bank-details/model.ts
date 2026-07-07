import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';
import { Farmer } from '../model';

interface FarmerBankDetailsAttributes {
    id: string;
    farmerId: string;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    bankName?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type FarmerBankDetailsCreationAttributes = Optional<FarmerBankDetailsAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class FarmerBankDetails extends Model<FarmerBankDetailsAttributes, FarmerBankDetailsCreationAttributes> implements FarmerBankDetailsAttributes {
    public id!: string;
    public farmerId!: string;
    public accountHolderName?: string | null;
    public accountNumber?: string | null;
    public ifscCode?: string | null;
    public bankName?: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

FarmerBankDetails.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, unique: true },
        farmerId: { type: DataTypes.UUID, allowNull: false, field: 'farmer_id' },
        accountHolderName: { type: DataTypes.STRING(255), allowNull: true, field: 'account_holder_name' },
        accountNumber: { type: DataTypes.STRING(50), allowNull: true, field: 'account_number' },
        ifscCode: { type: DataTypes.STRING(20), allowNull: true, field: 'ifsc_code' },
        bankName: { type: DataTypes.STRING(255), allowNull: true, field: 'bank_name' },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    {
        sequelize,
        tableName: 'farmer_bank_details',
        timestamps: true,
        paranoid: true,
    }
);

Farmer.hasOne(FarmerBankDetails, { foreignKey: 'farmerId', as: 'bankDetails' });
FarmerBankDetails.belongsTo(Farmer, { foreignKey: 'farmerId', as: 'farmer' });
