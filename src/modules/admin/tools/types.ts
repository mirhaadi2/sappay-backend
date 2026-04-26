/**
 * Admin Tools Module Types
 * Defines all DTOs and response types for QR code and barcode generation
 */

export interface GenerateQRCodeRequest {
    value: string;
    size?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    format?: 'image/png' | 'image/jpeg' | 'image/svg+xml';
}

export interface GenerateQRCodeResponse {
    success: boolean;
    data: {
        qrCode: string; // Base64 encoded or URL
        format: string;
        generatedAt: string;
    };
}

export interface GenerateBarcodeRequest {
    value: string;
    format?: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC';
    height?: number;
    width?: number;
    displayValue?: boolean;
}

export interface GenerateBarcodeResponse {
    success: boolean;
    data: {
        barcode: string; // Base64 encoded or URL
        format: string;
        generatedAt: string;
    };
}

export interface QRCodeGenerationParams {
    value: string;
    size?: number;
    errorCorrectionLevel?: string;
}

export interface BarcodeGenerationParams {
    value: string;
    format?: string;
    height?: number;
    width?: number;
    displayValue?: boolean;
}
