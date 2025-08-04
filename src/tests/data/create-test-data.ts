/**
 * Create Test Data Script
 * 
 * This script creates sample registrations for testing our dashboard!
 * It uses REAL database operations - no mocks! 🎉
 */

import { createDatabaseConnection, getDatabase } from '../../database/connection';
import { organizations, qrCodeSets, registrations } from '../../database/schema';

async function createTestData() {
  try {
    console.log('🚀 Creating test data for dashboard...');
    
    // Initialize database connection
    createDatabaseConnection();
    const db = getDatabase();

    // Create test organization
    const [testOrg] = await db.insert(organizations).values({
      name: 'Amazing Tech Conference 2025',
      eventName: 'Tech Innovation Summit',
      customDomain: 'techsummit2025',
      contactEmail: 'admin@techsummit2025.com',
      contactPhone: '555-123-4567',
      contactAddress: '123 Innovation Drive',
      contactCity: 'San Francisco',
      contactState: 'CA',
      contactZip: '94105',
      emailVerified: true,
    }).returning();

    console.log(`✅ Created organization: ${testOrg.name} (${testOrg.id})`);

    // Create test QR code set
    const [testQRSet] = await db.insert(qrCodeSets).values({
      organizationId: testOrg.id,
      name: 'Conference Registration',
      formFields: [
        { name: 'firstName', type: 'text', required: true, label: 'First Name' },
        { name: 'lastName', type: 'text', required: true, label: 'Last Name' },
        { name: 'email', type: 'email', required: true, label: 'Email Address' },
        { name: 'company', type: 'text', required: false, label: 'Company' },
        { name: 'jobTitle', type: 'text', required: false, label: 'Job Title' },
      ],
      qrCodes: [
        { id: 'main-entry', label: 'Main Entry', url: 'https://blessbox.app/register/techsummit2025/main-entry' },
        { id: 'vip-entry', label: 'VIP Entry', url: 'https://blessbox.app/register/techsummit2025/vip-entry' },
        { id: 'staff-entry', label: 'Staff Entry', url: 'https://blessbox.app/register/techsummit2025/staff-entry' },
      ],
    }).returning();

    console.log(`✅ Created QR code set: ${testQRSet.name} (${testQRSet.id})`);

    // Create sample registrations with different statuses and realistic data
    const sampleRegistrations = [
      {
        qrCodeSetId: testQRSet.id,
        qrCodeId: 'main-entry',
        registrationData: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@techcorp.com',
          company: 'TechCorp Solutions',
          jobTitle: 'Senior Developer',
        },
        deliveryStatus: 'delivered' as const,
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        registeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        qrCodeSetId: testQRSet.id,
        qrCodeId: 'vip-entry',
        registrationData: {
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@startup.io',
          company: 'Startup Innovations',
          jobTitle: 'CTO',
        },
        deliveryStatus: 'delivered' as const,
        deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        registeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        qrCodeSetId: testQRSet.id,
        qrCodeId: 'main-entry',
        registrationData: {
          firstName: 'Emily',
          lastName: 'Rodriguez',
          email: 'emily.rodriguez@designstudio.com',
          company: 'Creative Design Studio',
          jobTitle: 'UX Designer',
        },
        deliveryStatus: 'pending' as const,
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        registeredAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        qrCodeSetId: testQRSet.id,
        qrCodeId: 'staff-entry',
        registrationData: {
          firstName: 'David',
          lastName: 'Kim',
          email: 'david.kim@eventstaff.com',
          company: 'Event Staff Solutions',
          jobTitle: 'Event Coordinator',
        },
        deliveryStatus: 'failed' as const,
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        registeredAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
      {
        qrCodeSetId: testQRSet.id,
        qrCodeId: 'main-entry',
        registrationData: {
          firstName: 'Lisa',
          lastName: 'Thompson',
          email: 'lisa.thompson@marketing.pro',
          company: 'Marketing Professionals',
          jobTitle: 'Marketing Director',
        },
        deliveryStatus: 'pending' as const,
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        registeredAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
      {
        qrCodeSetId: testQRSet.id,
        qrCodeId: 'vip-entry',
        registrationData: {
          firstName: 'James',
          lastName: 'Wilson',
          email: 'james.wilson@enterprise.com',
          company: 'Enterprise Solutions Inc',
          jobTitle: 'VP of Engineering',
        },
        deliveryStatus: 'delivered' as const,
        deliveredAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        registeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
      {
        qrCodeSetId: testQRSet.id,
        qrCodeId: 'main-entry',
        registrationData: {
          firstName: 'Anna',
          lastName: 'Garcia',
          email: 'anna.garcia@freelance.dev',
          company: 'Freelance Developer',
          jobTitle: 'Full Stack Developer',
        },
        deliveryStatus: 'failed' as const,
        ipAddress: '192.168.1.106',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        registeredAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      },
    ];

    // Insert all sample registrations
    const insertedRegistrations = await db.insert(registrations).values(sampleRegistrations).returning();
    
    console.log(`✅ Created ${insertedRegistrations.length} sample registrations:`);
    insertedRegistrations.forEach((reg, index) => {
      const data = reg.registrationData as any;
      console.log(`   ${index + 1}. ${data.firstName} ${data.lastName} (${reg.deliveryStatus}) - ${reg.qrCodeId}`);
    });

    console.log('\n🎉 Test data creation completed successfully!');
    console.log(`\n📊 Dashboard URL: http://localhost:7777/dashboard?orgId=${testOrg.id}`);
    console.log(`\n🏢 Organization ID: ${testOrg.id}`);
    console.log(`📱 QR Code Set ID: ${testQRSet.id}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

// Run the script
createTestData();