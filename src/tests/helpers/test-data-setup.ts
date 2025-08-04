// 🎉 JOYFUL TEST DATA SETUP - Creating beautiful test organizations! ✨
import { createDatabaseConnection, getDatabase } from '../../database/connection';
import { organizations } from '../../database/schema';
import { eq } from 'drizzle-orm';

export async function createTestOrganization(email: string) {
  await createDatabaseConnection();
  const db = getDatabase();

  // 🌟 Create a test organization with PURE JOY!
  const testOrg = {
    name: 'Test Organization',
    eventName: 'Test Event',
    contactEmail: email,
    contactPhone: '555-0123',
    contactAddress: '123 Test St',
    contactCity: 'Test City',
    contactState: 'TS',
    contactZip: '12345',
    emailVerified: true,
  };

  // 🎯 Insert and get the organization ID for SQLite
  const result = await db.insert(organizations).values(testOrg);
  
  // 🌟 Fetch the created organization
  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.contactEmail, email))
    .limit(1);
  console.log(`🎊 Created test organization: ${organization.id} for ${email}`);
  
  return organization;
}

export async function cleanupTestOrganization(email: string) {
  try {
    await createDatabaseConnection();
    const db = getDatabase();
    
    await db.delete(organizations).where(eq(organizations.contactEmail, email));
    console.log(`🧹 Cleaned up test organization for ${email}`);
  } catch (error) {
    console.log(`🤷 Cleanup failed for ${email}:`, error);
  }
}