#!/usr/bin/env tsx

import { createDatabaseConnection } from '../src/database/connection';
import { OrganizationRepository } from '../src/implementations/repositories/OrganizationRepository';
import { QRCodeRepository } from '../src/implementations/repositories/QRCodeRepository';
import { RegistrationRepository } from '../src/implementations/repositories/RegistrationRepository';

// Test organization ID that matches the test suite
const TEST_ORG_ID = 'test-org-123';
const TEST_QR_SET_ID = 'test-qr-set-123';

interface SeedResult {
  organizationId: string;
  qrCodeSetId: string;
  registrationCount: number;
}

async function seedTestData(): Promise<SeedResult> {
  console.log('🌱 Starting test data seeding...');
  
  try {
    await createDatabaseConnection();
    
    const orgRepo = new OrganizationRepository();
    const qrRepo = new QRCodeRepository();
    const regRepo = new RegistrationRepository();

    // Check if test organization already exists
    let organization = await orgRepo.findById(TEST_ORG_ID);
    
    if (!organization) {
      console.log('📝 Creating test organization...');
      // Create test organization with fixed ID
      await orgRepo.create({
        id: TEST_ORG_ID,
        name: 'E2E Test Organization',
        eventName: 'Test Event 2024',
        contactEmail: 'test@example.com',
        contactPhone: '+1-555-123-4567',
        contactAddress: '123 Test Street',
        contactCity: 'Test City',
        contactState: 'TS',
        contactZip: '12345',
        emailVerified: true,
      } as any);
      
      organization = await orgRepo.findById(TEST_ORG_ID);
      if (!organization) throw new Error('Failed to create test organization');
    }
    
    console.log(`✓ Organization: ${organization.name} (${organization.id})`);

    // Check if QR code set already exists
    let qrCodeSets = await qrRepo.findByOrganizationId(TEST_ORG_ID);
    let qrCodeSet = qrCodeSets.find(set => set.id === TEST_QR_SET_ID);
    
    if (!qrCodeSet) {
      console.log('🔲 Creating test QR code set...');
      
      const formFields = [
        {
          id: 'firstName',
          label: 'First Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your first name'
        },
        {
          id: 'lastName',
          label: 'Last Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your last name'
        },
        {
          id: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          placeholder: 'Enter your email'
        },
        {
          id: 'phone',
          label: 'Phone Number',
          type: 'tel',
          required: false,
          placeholder: 'Enter your phone number'
        }
      ];

      const qrCodes = [
        {
          id: 'main-entrance',
          label: 'Main Entrance',
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        {
          id: 'side-entrance',
          label: 'Side Entrance', 
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        {
          id: 'vip-entrance',
          label: 'VIP Entrance',
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      ];

      // Use QRCodeRepository's create method with a custom ID
      const qrSetData = {
        id: TEST_QR_SET_ID,
        organizationId: TEST_ORG_ID,
        name: 'Test Event Registration',
        language: 'en',
        formFields,
        qrCodes,
      };
      
      // Direct database insert since we need a specific ID
      await qrRepo.create(qrSetData);
      qrCodeSet = await qrRepo.findById(TEST_QR_SET_ID);
      
      if (!qrCodeSet) throw new Error('Failed to create test QR code set');
    }
    
    console.log(`✓ QR Code Set: ${qrCodeSet.name} (${qrCodeSet.id})`);

    // Create sample registrations
    console.log('👥 Creating sample registrations...');
    
    const sampleRegistrations = [
      {
        qrCodeId: 'main-entrance',
        registrationData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-001-0001'
        }
      },
      {
        qrCodeId: 'side-entrance',
        registrationData: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1-555-001-0002'
        }
      },
      {
        qrCodeId: 'main-entrance',
        registrationData: {
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@example.com',
          phone: '+1-555-001-0003'
        }
      },
      {
        qrCodeId: 'vip-entrance',
        registrationData: {
          firstName: 'Alice',
          lastName: 'Wilson',
          email: 'alice.wilson@example.com',
          phone: '+1-555-001-0004'
        }
      },
      {
        qrCodeId: 'side-entrance',
        registrationData: {
          firstName: 'Charlie',
          lastName: 'Brown',
          email: 'charlie.brown@example.com',
          phone: '+1-555-001-0005'
        }
      },
      {
        qrCodeId: 'main-entrance',
        registrationData: {
          firstName: 'Diana',
          lastName: 'Davis',
          email: 'diana.davis@example.com',
          phone: '+1-555-001-0006'
        }
      },
      {
        qrCodeId: 'vip-entrance',
        registrationData: {
          firstName: 'Edward',
          lastName: 'Miller',
          email: 'edward.miller@example.com',
          phone: '+1-555-001-0007'
        }
      },
      {
        qrCodeId: 'side-entrance',
        registrationData: {
          firstName: 'Fiona',
          lastName: 'Garcia',
          email: 'fiona.garcia@example.com',
          phone: '+1-555-001-0008'
        }
      }
    ];

    // Check existing registrations count
    const existingCount = await regRepo.countByQRCodeSetId(TEST_QR_SET_ID);
    let createdCount = 0;

    if (existingCount < sampleRegistrations.length) {
      const existing = await regRepo.findByQRCodeSetId(TEST_QR_SET_ID, 100);
      const existingEmails = new Set(existing.map(r => r.registrationData.email));
      
      for (const regData of sampleRegistrations) {
        if (!existingEmails.has(regData.registrationData.email)) {
          await regRepo.create({
            qrCodeSetId: TEST_QR_SET_ID,
            qrCodeId: regData.qrCodeId,
            registrationData: regData.registrationData,
            ipAddress: '127.0.0.1',
            userAgent: 'E2E-Test-User-Agent'
          });
          createdCount++;
        }
      }
    }

    const totalRegistrations = await regRepo.countByQRCodeSetId(TEST_QR_SET_ID);
    
    console.log(`✓ Registrations: ${totalRegistrations} total (${createdCount} new)`);
    console.log('🎉 Test data seeding completed successfully!');
    
    return {
      organizationId: TEST_ORG_ID,
      qrCodeSetId: TEST_QR_SET_ID,
      registrationCount: totalRegistrations
    };
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

async function cleanupTestData(): Promise<void> {
  console.log('🧹 Cleaning up test data...');
  
  try {
    await createDatabaseConnection();
    
    const orgRepo = new OrganizationRepository();
    
    // Delete test organization (cascade will handle related data)
    const organization = await orgRepo.findById(TEST_ORG_ID);
    if (organization) {
      await orgRepo.delete(TEST_ORG_ID);
      console.log('✓ Test organization and related data deleted');
    } else {
      console.log('ℹ️  No test organization found to delete');
    }
    
    console.log('🎉 Test data cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    throw error;
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'seed') {
  seedTestData()
    .then((result) => {
      console.log('\n📊 Seed Results:');
      console.log(`   Organization ID: ${result.organizationId}`);
      console.log(`   QR Code Set ID: ${result.qrCodeSetId}`);
      console.log(`   Registration Count: ${result.registrationCount}`);
    })
    .catch((error) => {
      console.error('Failed to seed test data:', error);
      process.exit(1);
    });
} else if (command === 'cleanup') {
  cleanupTestData()
    .catch((error) => {
      console.error('Failed to clean up test data:', error);
      process.exit(1);
    });
} else {
  console.log('Usage:');
  console.log('  tsx scripts/test-data-seeder.ts seed    - Create test data');
  console.log('  tsx scripts/test-data-seeder.ts cleanup - Remove test data');
  process.exit(1);
}