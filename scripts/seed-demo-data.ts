#!/usr/bin/env tsx

/**
 * Comprehensive Demo Data Seeder
 * 
 * Creates realistic demo data:
 * - 3-4 organizations with different purposes
 * - 3-4 QR code sets per organization (representing lanes/entrances)
 * - 10-20 users per organization with full address information
 * - Registrations distributed across different QR lanes
 */

import { db } from '../src/lib/database/connection'
import { 
  organizations, 
  qrCodeSets, 
  registrations, 
  users,
  userOrganizations
} from '../src/lib/database/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// Realistic sample data
const ORGANIZATIONS = [
  {
    name: "Hope Community Food Bank",
    slug: "hope-food-bank",
    contactEmail: "admin@hopefoodbank.org",
    eventName: "Weekly Food Distribution",
    type: "food_distribution",
    lanes: ["Main Entrance", "Side Door", "Drive-Through", "Express Lane"]
  },
  {
    name: "Tech Skills Summit 2025",
    slug: "tech-summit-2025",
    contactEmail: "registration@techsummit.org",
    eventName: "Annual Tech Conference",
    type: "conference",
    lanes: ["Registration Desk A", "Registration Desk B", "VIP Check-In", "Workshop Sign-In"]
  },
  {
    name: "Green Valley Volunteer Center",
    slug: "green-valley-volunteers",
    contactEmail: "coordinator@greenvalley.org",
    eventName: "Community Service Projects",
    type: "volunteer_signup",
    lanes: ["Orientation Station", "Skills Assessment", "Project Assignment"]
  },
  {
    name: "Downtown Health Clinic",
    slug: "downtown-health",
    contactEmail: "intake@downtownhealth.org",
    eventName: "Free Health Screenings",
    type: "patient_intake",
    lanes: ["Triage Station", "Insurance Verification", "General Admission", "Urgent Care"]
  }
]

const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle"
]

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young"
]

const STREETS = [
  "Main Street", "Oak Avenue", "Maple Drive", "Cedar Lane", "Pine Road",
  "Elm Boulevard", "Washington Street", "Park Avenue", "Forest Drive", "Lake Road",
  "Hill Street", "Valley View", "Mountain Way", "River Road", "Sunset Boulevard"
]

const CITIES = [
  { name: "Springfield", state: "IL", zip: "62701" },
  { name: "Riverside", state: "CA", zip: "92501" },
  { name: "Madison", state: "WI", zip: "53703" },
  { name: "Portland", state: "OR", zip: "97201" },
  { name: "Austin", state: "TX", zip: "78701" },
  { name: "Denver", state: "CO", zip: "80201" },
  { name: "Seattle", state: "WA", zip: "98101" },
  { name: "Phoenix", state: "AZ", zip: "85001" }
]

function generateRandomPhone(): string {
  const areaCode = Math.floor(Math.random() * 800) + 200
  const prefix = Math.floor(Math.random() * 800) + 200
  const line = Math.floor(Math.random() * 9000) + 1000
  return `(${areaCode}) ${prefix}-${line}`
}

function generateRandomEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"]
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const num = Math.random() > 0.5 ? Math.floor(Math.random() * 100) : ""
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${num}@${domain}`
}

function generateAddress() {
  const streetNum = Math.floor(Math.random() * 9000) + 1000
  const street = STREETS[Math.floor(Math.random() * STREETS.length)]
  const city = CITIES[Math.floor(Math.random() * CITIES.length)]
  const apt = Math.random() > 0.6 ? ` Apt ${Math.floor(Math.random() * 50) + 1}` : ""
  
  return {
    street: `${streetNum} ${street}${apt}`,
    city: city.name,
    state: city.state,
    zipCode: city.zip,
    country: "USA"
  }
}

async function seedData() {
  console.log("🌱 Starting comprehensive demo data seeding...")
  console.log("=" .repeat(60))

  try {
    // Clear existing data
    console.log("\n🗑️  Clearing existing data...")
    await db.delete(registrations)
    // No separate qrCodes table - they're part of qrCodeSets
    await db.delete(qrCodeSets)
    await db.delete(userOrganizations)
    await db.delete(organizations)
    await db.delete(users)
    console.log("✅ Cleared existing data")

    let totalUsers = 0
    let totalQRCodes = 0
    let totalRegistrations = 0
    const loginCredentials: Array<{org: string, email: string, password: string}> = []

    // Create organizations with QR codes and users
    for (const orgData of ORGANIZATIONS) {
      console.log(`\n${"=".repeat(60)}`)
      console.log(`🏢 Creating: ${orgData.name}`)
      console.log(`${"=".repeat(60)}`)

      // Create organization admin user
      const hashedPassword = await bcrypt.hash("Demo123!", 12)
      
      // Create user first
      await db.insert(users).values({
        email: orgData.contactEmail,
        name: `${orgData.name} Admin`,
        phone: generateRandomPhone(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      console.log(`👤 Admin User: ${orgData.contactEmail}`)

      // Create organization
      const [org] = await db.insert(organizations).values({
        id: crypto.randomUUID(),
        name: orgData.name,
        slug: orgData.slug,
        eventName: orgData.eventName,
        customDomain: orgData.slug,
        contactEmail: orgData.contactEmail,
        passwordHash: hashedPassword,
        emailVerified: true,
        billingStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning()

      console.log(`✅ Organization ID: ${org.id}`)

      // Link user to organization
      await db.insert(userOrganizations).values({
        userEmail: orgData.contactEmail,
        organizationId: org.id,
        role: 'owner',
        joinedAt: new Date().toISOString(),
      })

      loginCredentials.push({
        org: orgData.name,
        email: orgData.contactEmail,
        password: "Demo123!"
      })

      // Create QR Code Sets (lanes)
      console.log(`\n📱 Creating QR Code Sets (lanes):`)
      const qrCodeSetRecords: Array<{id: string, qrCodes: Array<{id: string, token: string}>}> = []
      
      for (const laneName of orgData.lanes) {
        const [qrCodeSet] = await db.insert(qrCodeSets).values({
          organizationId: org.id,
          name: laneName,
          language: 'en',
          formFields: JSON.stringify([]),
          qrCodes: JSON.stringify([]),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).returning()

        // Store QR code set record for reference
        qrCodeSetRecords.push({
          id: qrCodeSet.id,
          qrCodes: [] // No individual QR codes in this schema
        })
        
        totalQRCodes++
        console.log(`   ✅ ${laneName}`)
      }

      // Generate users for this organization (15-20 per org)
      const numUsers = Math.floor(Math.random() * 6) + 15 // 15-20 users
      console.log(`\n👥 Generating ${numUsers} registrations:`)

      for (let i = 0; i < numUsers; i++) {
        const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
        const fullName = `${firstName} ${lastName}`
        const email = generateRandomEmail(firstName, lastName)
        const phone = generateRandomPhone()
        const address = generateAddress()
        const familySize = Math.floor(Math.random() * 6) + 1 // 1-6 members

        // Pick a random QR code set and QR code
        const qrSet = qrCodeSetRecords[Math.floor(Math.random() * qrCodeSetRecords.length)]
        const qrCode = qrSet.qrCodes[0]

        // Create registration
        const checkInToken = crypto.randomBytes(32).toString('hex')
        const isCheckedIn = Math.random() > 0.3 // 70% checked in
        
        await db.insert(registrations).values({
          id: crypto.randomUUID(),
          organizationId: org.id,
          qrCodeSetId: qrSet.id,
          qrCodeId: qrCode.id,
          registrationData: {
            name: fullName,
            email,
            phone,
            address: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            familySize
          },
          checkInToken,
          tokenStatus: isCheckedIn ? 'used' : 'active',
          checkedInAt: isCheckedIn ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          deliveryStatus: 'delivered',
          registeredAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        })

        totalUsers++
        totalRegistrations++

        if ((i + 1) % 5 === 0) {
          console.log(`   ✅ ${i + 1}/${numUsers} registrations created...`)
        }
      }

      console.log(`   ✅ ${numUsers} registrations completed`)
      console.log(`\n📊 ${orgData.name} Summary:`)
      console.log(`   • QR Code Sets (Lanes): ${qrCodeSetRecords.length}`)
      console.log(`   • Registrations: ${numUsers}`)
    }

    console.log(`\n${"=".repeat(60)}`)
    console.log(`🎉 SEEDING COMPLETE!`)
    console.log(`${"=".repeat(60)}`)
    console.log(`\n📊 Total Summary:`)
    console.log(`   • Organizations: ${ORGANIZATIONS.length}`)
    console.log(`   • QR Code Sets (Lanes): ${totalQRCodes}`)
    console.log(`   • Total Registrations: ${totalRegistrations}`)

    console.log(`\n🔑 Login Credentials:`)
    console.log(`${"=".repeat(60)}`)
    for (const cred of loginCredentials) {
      console.log(`\n🏢 ${cred.org}`)
      console.log(`   Email: ${cred.email}`)
      console.log(`   Password: ${cred.password}`)
      console.log(`   Login: http://localhost:7777/auth/login`)
    }

    console.log(`\n✅ You can now login with any of these accounts!`)
    console.log(`${"=".repeat(60)}`)

  } catch (error) {
    console.error("\n❌ Error seeding data:", error)
    throw error
  }
}

// Run seeder
seedData()
  .then(() => {
    console.log("\n✅ Seeding script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Seeding script failed:", error)
    process.exit(1)
  })
