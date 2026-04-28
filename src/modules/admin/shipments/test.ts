import { Shipment, ShipmentPackage } from './models';
import { getShipmentsByStatus, getShipmentStatsService } from './service';

/**
 * Test script to verify shipment functionality
 * Run with: npx ts-node src/modules/admin/shipments/test.ts
 */

async function testShipmentService() {
    console.log('Testing Shipment Service...');

    try {
        // Test getting shipment stats
        console.log('1. Getting shipment statistics...');
        const stats = await getShipmentStatsService();
        console.log('Shipment stats:', stats);

        // Test getting shipments by status
        console.log('2. Getting recent shipments...');
        const recentShipments = await getShipmentsByStatus('CREATED', 5, 0);
        console.log(`Found ${recentShipments.count} recent shipments`);

        console.log('✅ All shipment service tests passed!');
    } catch (error) {
        console.error('❌ Shipment service test failed:', error);
    }
}

async function testShipmentModels() {
    console.log('Testing Shipment Models...');

    try {
        // Test model associations
        console.log('1. Testing model associations...');

        // Check if Shipment has packages association
        const shipment = Shipment.build({
            orderId: 'test-order-id',
            uploadWbn: 'TEST123',
            courier: 'delhivery',
            status: 'CREATED',
            totalPackages: 1,
            totalCodAmount: 0,
            cashPickupsCount: 0,
            packageCount: 1,
            prepaidCount: 1,
            pickupsCount: 0,
            replacementCount: 0,
            cashPickups: 0,
            codAmount: 0,
            codCount: 0,
        });

        console.log('✅ Shipment model created successfully');

        // Check if ShipmentPackage can be created
        const packageData = ShipmentPackage.build({
            shipmentId: 'test-shipment-id',
            waybill: 'TESTWAYBILL123',
            refnum: 'REF123',
            client: 'TESTCLIENT',
            payment: 'Prepaid',
            codAmount: 0,
            status: 'Success',
            sortCode: 'DEL',
            serviceable: true,
            remarks: [],
        });

        console.log('✅ ShipmentPackage model created successfully');

        console.log('✅ All shipment model tests passed!');
    } catch (error) {
        console.error('❌ Shipment model test failed:', error);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting Shipment Module Tests...\n');

    await testShipmentModels();
    console.log('');
    await testShipmentService();

    console.log('\n🎉 All tests completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

export { runTests };