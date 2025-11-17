#!/usr/bin/env node

import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';

// Create database client
const client = createClient({
  url: 'file:blessbox.db'
});

async function seedDemoData() {
  console.log('🌱 Seeding demo data...');
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await client.execute('DELETE FROM registrations');
    await client.execute('DELETE FROM qr_code_sets');
    await client.execute('DELETE FROM organizations');
    
    // Create demo organizations
    console.log('🏢 Creating demo organizations...');
    
    const organizations = [
      {
        id: uuidv4(),
        name: 'Hope Community Food Bank',
        custom_domain: 'hopefoodbank',
        contact_email: 'admin@hopefoodbank.org',
        contact_phone: '+1-555-123-4567',
        contact_address: '123 Main St',
        contact_city: 'Springfield',
        contact_state: 'IL',
        contact_zip: '62701',
        email_verified: 1
      },
      {
        id: uuidv4(),
        name: 'Tech Skills Summit 2025',
        custom_domain: 'techsummit',
        contact_email: 'registration@techsummit.org',
        contact_phone: '+1-555-234-5678',
        contact_address: '456 Tech Ave',
        contact_city: 'San Francisco',
        contact_state: 'CA',
        contact_zip: '94105',
        email_verified: 1
      }
    ];
    
    for (const org of organizations) {
      await client.execute({
        sql: `INSERT INTO organizations (id, name, custom_domain, contact_email, contact_phone, contact_address, contact_city, contact_state, contact_zip, email_verified, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [org.id, org.name, org.custom_domain, org.contact_email, org.contact_phone, org.contact_address, org.contact_city, org.contact_state, org.contact_zip, org.email_verified]
      });
      console.log(`✅ Created organization: ${org.name}`);
    }
    
    // Create QR code sets for each organization
    console.log('🔲 Creating QR code sets...');
    
    for (const org of organizations) {
      const qrCodeSetId = uuidv4();
      
      // Define form fields based on organization
      const formFields = [
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'Enter your email',
          required: true
        },
        {
          id: 'phone',
          type: 'phone',
          label: 'Phone Number',
          placeholder: 'Enter your phone number',
          required: true
        },
        {
          id: 'familySize',
          type: 'select',
          label: 'Family Size',
          placeholder: 'Select family size',
          required: true,
          options: ['1-2 people', '3-4 people', '5+ people']
        }
      ];
      
      // Create QR codes
      const qrCodes = [
        {
          id: 'main-entrance',
          label: 'main-entrance',
          url: `https://blessbox.org/register/${org.custom_domain}/main-entrance`,
          description: 'Main Entrance'
        },
        {
          id: 'side-door',
          label: 'side-door',
          url: `https://blessbox.org/register/${org.custom_domain}/side-door`,
          description: 'Side Door'
        }
      ];
      
      await client.execute({
        sql: `INSERT INTO qr_code_sets (id, organization_id, name, language, form_fields, qr_codes, is_active, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [qrCodeSetId, org.id, `${org.name} Registration Form`, 'en', JSON.stringify(formFields), JSON.stringify(qrCodes), 1]
      });
      
      console.log(`✅ Created QR code set for ${org.name}`);
      
      // Create some sample registrations
      console.log(`👥 Creating sample registrations for ${org.name}...`);
      
      const sampleRegistrations = [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '(555) 111-2222',
          familySize: '3-4 people',
          qrCodeId: 'main-entrance'
        },
        {
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          phone: '(555) 333-4444',
          familySize: '1-2 people',
          qrCodeId: 'side-door'
        },
        {
          name: 'Bob Johnson',
          email: 'bob.johnson@example.com',
          phone: '(555) 555-6666',
          familySize: '5+ people',
          qrCodeId: 'main-entrance'
        }
      ];
      
      for (const reg of sampleRegistrations) {
        const registrationId = uuidv4();
        await client.execute({
          sql: `INSERT INTO registrations (id, qr_code_set_id, qr_code_id, organization_id, registration_data, delivery_status, registered_at) 
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          args: [registrationId, qrCodeSetId, reg.qrCodeId, org.id, JSON.stringify(reg), 'pending']
        });
      }
      
      console.log(`✅ Created ${sampleRegistrations.length} sample registrations for ${org.name}`);
    }
    
    console.log('🎉 Demo data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${organizations.length} organizations created`);
    console.log(`- ${organizations.length} QR code sets created`);
    console.log(`- ${organizations.length * 3} sample registrations created`);
    console.log('\n🔗 Test URLs:');
    console.log('- http://localhost:7777/register/hopefoodbank/main-entrance');
    console.log('- http://localhost:7777/register/techsummit/main-entrance');
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the seeding
seedDemoData();
