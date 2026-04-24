import QRCode from 'qrcode';
import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const JsBarcode = require('jsbarcode');

export const generateQrCodeDataUrl = async (value: string) => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) {
    throw new Error('QR code value is required');
  }

  // We explicitly set the color here to override any defaults
  return QRCode.toDataURL(normalizedValue, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 1,
    color: {
      dark: '#000000FF',  // Solid Black
      light: '#00000000'  // Fully Transparent (The last two '00' are the Alpha channel)
    }
  });
};

export const generateBarcodeDataUrl = (value: string, height = 40, width = 1) => {
    try {
        const normalizedValue = String(value || '').trim();
        if (!normalizedValue) {
            throw new Error('Barcode value is required');
        }

        const document = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null);
        const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        JsBarcode(svgNode, normalizedValue, {
            xmlDocument: document,
            format: "CODE128", 
            width: width,      
            height: height,    
            displayValue: false,
            margin: 0,
        });

        // --- BACKEND FIX FOR SIZE ---
        // 1. Get the actual width JsBarcode calculated (e.g., 300px)
        const actualWidth = svgNode.getAttribute('width');
        
        // 2. Set a fixed "Small" width for the container
        const targetWidth = "150"; // You can change this to 100 or 120
        
        // 3. Force the SVG to scale internally
        svgNode.setAttribute('viewBox', `0 0 ${actualWidth} ${height}`);
        svgNode.setAttribute('width', targetWidth);
        svgNode.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        // ----------------------------

        const xml = new XMLSerializer().serializeToString(svgNode);
        return `data:image/svg+xml;base64,${Buffer.from(xml, 'utf8').toString('base64')}`;
    } catch (error) {
        throw new Error('Failed to generate barcode: ' + (error as Error).message);
    }
};
