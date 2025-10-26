/**
 * Seed Demo Data API Endpoint
 * POST /api/seed to populate database with demo data
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database/connection'
import { 
  organizations, 
  qrCodeSets, 
  registrations, 
  users,
  userOrganizations
} from '@/lib/database/schema'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const ORGANIZATIONS = [
  {
    name: "Hope Community Food Bank",
    slug: "hope-food-bank",
    contactEmail: "admin@hopefoodbank.org",
    eventName: "Weekly Food Distribution",
    lanes: ["Main Entrance", "Side Door", "Drive-Through", "Express Lane"]
  },
  {
    name: "Tech Skills Summit 2025",
    slug: "tech-summit-2025",
    contactEmail: "registration@techsummit.org",
    eventName: "Annual Tech Conference",
    lanes: ["Registration Desk A", "Registration Desk B", "VIP Check-In", "Workshop Sign-In"]
  },
  {
    name: "Green Valley Volunteer Center",
    slug: "green-valley-volunteers",
    contactEmail: "coordinator@greenvalley.org",
    eventName: "Community Service Projects",
    lanes: ["Orientation Station", "Skills Assessment", "Project Assignment"]
  },
  {
    name: "Downtown Health Clinic",
    slug: "downtown-health",
    contactEmail: "intake@downtownhealth.org",
    eventName: "Free Health Screenings",
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
  "Elm Boulevard", "Washington Street", "Park Avenue", "Forest Drive", "Lake Road"
]

const CITIES = [
  { name: "Springfield", state: "IL", zip: "62701" },
  { name: "Riverside", state: "CA", zip: "92501" },
  { name: "Madison", state: "WI", zip: "53703" },
  { name: "Portland", state: "OR", zip: "97201" },
  { name: "Austin", state: "TX", zip: "78701" }
]

function generateRandomPhone(): string {
  const areaCode = Math.floor(Math.random() * 800) + 200
  const prefix = Math.floor(Math.random() * 800) + 200
  const line = Math.floor(Math.random() * 9000) + 1000
  return `(${areaCode}) ${prefix}-${line}`
}

function generateRandomEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com"]
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const num = Math.random() > 0.5 ? Math.floor(Math.random() * 100) : ""
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${num}@${domain}`
}

function generateAddress() {
  const streetNum = Math.floor(Math.random() * 9000) + 1000
  const street = STREETS[Math.floor(Math.random() * STREETS.length)]
  const city = CITIES[Math.floor(Math.random() * CITIES.length)]
  
  return {
    street: `${streetNum} ${street}`,
    city: city.name,
    state: city.state,
    zipCode: city.zip
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🌱 Starting seed process...")

    // Clear existing data
    await db.delete(registrations)
    await db.delete(qrCodeSets)
    await db.delete(userOrganizations)
    await db.delete(organizations)
    await db.delete(users)

    const loginCredentials: Array<{org: string, email: string, password: string}> = []
    let totalRegistrations = 0

    // Create organizations
    for (const orgData of ORGANIZATIONS) {
      const hashedPassword = await bcrypt.hash("Demo123!", 12)
      
      // Create user
      await db.insert(users).values({
        email: orgData.contactEmail,
        name: `${orgData.name} Admin`,
        phone: generateRandomPhone(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

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

      // Create QR Code Sets
      const qrCodeSetRecords: Array<{id: string, qrCodes: Array<{id: string, token: string}>}> = []
      
      for (const laneName of orgData.lanes) {
        const [qrCodeSet] = await db.insert(qrCodeSets).values({
          organizationId: org.id,
          name: laneName,
          language: 'en',
          formFields: JSON.stringify([]),
          qrCodes: JSON.stringify([]),
          isActive: true,
        }).returning()

        qrCodeSetRecords.push({
          id: qrCodeSet.id,
          qrCodes: [] // No individual QR codes in this schema
        })
      }

      // Generate registrations
      const numUsers = Math.floor(Math.random() * 6) + 15 // 15-20 users
      
      for (let i = 0; i < numUsers; i++) {
        const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
        const fullName = `${firstName} ${lastName}`
        const email = generateRandomEmail(firstName, lastName)
        const phone = generateRandomPhone()
        const address = generateAddress()
        const familySize = Math.floor(Math.random() * 6) + 1

        const qrSet = qrCodeSetRecords[Math.floor(Math.random() * qrCodeSetRecords.length)]
        const qrCode = qrSet.qrCodes[0]

        const checkInToken = crypto.randomBytes(32).toString('hex')
        const isCheckedIn = Math.random() > 0.3
        
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

        totalRegistrations++
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      data: {
        organizations: ORGANIZATIONS.length,
        totalRegistrations,
        loginCredentials
      }
    })

  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

