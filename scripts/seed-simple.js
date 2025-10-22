// Simple seed script using sqlite3 directly
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')

const db = new Database('./blessbox.db')

// Seed data
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
    lanes: ["Registration Desk A", "Registration Desk B", "VIP Check-In"]
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
    lanes: ["Triage", "Insurance", "General", "Urgent Care"]
  }
]

const FIRST_NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Barbara", "David", "Elizabeth"]
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
const STREETS = ["Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Pine Rd", "Elm Blvd"]
const CITIES = [
  { name: "Springfield", state: "IL", zip: "62701" },
  { name: "Portland", state: "OR", zip: "97201" },
  { name: "Austin", state: "TX", zip: "78701" }
]

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randNum(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

async function seed() {
  console.log("🌱 Seeding database...")
  
  try {
    // Clear tables (in correct order)
    console.log("Clearing tables...")
    db.exec("DELETE FROM registrations")
    db.exec("DELETE FROM qr_scans")
    db.exec("DELETE FROM qr_code_sets")
    db.exec("DELETE FROM user_organizations")
    db.exec("DELETE FROM organizations")
    db.exec("DELETE FROM users")
    
    const credentials = []
    let totalRegs = 0

    for (const orgData of ORGANIZATIONS) {
      console.log(`\n🏢 Creating ${orgData.name}...`)
      
      const hashedPassword = await bcrypt.hash("Demo123!", 12)
      const orgId = crypto.randomUUID()
      const now = new Date().toISOString()
      
      // Create user
      const userStmt = db.prepare("INSERT INTO users (email, name, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      userStmt.run(orgData.contactEmail, `${orgData.name} Admin`, `(555) ${randNum(200,999)}-${randNum(1000,9999)}`, now, now)

      // Create org
      const orgStmt = db.prepare(`INSERT INTO organizations (id, name, event_name, custom_domain, contact_email, password_hash, email_verified, billing_status, slug, created_at, updated_at) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      orgStmt.run(orgId, orgData.name, orgData.eventName, orgData.slug, orgData.contactEmail, hashedPassword, 1, 'active', orgData.slug, now, now)

      // Link user to org
      const linkStmt = db.prepare("INSERT INTO user_organizations (user_email, organization_id, role, joined_at) VALUES (?, ?, ?, ?)")
      linkStmt.run(orgData.contactEmail, orgId, 'owner', now)

      credentials.push({ org: orgData.name, email: orgData.contactEmail, password: "Demo123!" })

      // Create QR code sets
      const qrSets = []
      for (const lane of orgData.lanes) {
        const setId = crypto.randomUUID()
        const qrCodeId = crypto.randomUUID()
        const token = crypto.randomBytes(32).toString('hex')
        
        const formFields = JSON.stringify([
          { id: 'name', type: 'text', label: 'Full Name', required: true },
          { id: 'email', type: 'email', label: 'Email', required: true },
          { id: 'phone', type: 'tel', label: 'Phone', required: true },
          { id: 'address', type: 'text', label: 'Address', required: true },
          { id: 'city', type: 'text', label: 'City', required: true },
          { id: 'state', type: 'text', label: 'State', required: true },
          { id: 'zipCode', type: 'text', label: 'ZIP Code', required: true },
          { id: 'familySize', type: 'number', label: 'Family Size', required: false }
        ])
        
        const qrCodes = JSON.stringify([{
          id: qrCodeId,
          token: token,
          label: lane,
          imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${token}`
        }])
        
        const qrSetStmt = db.prepare(`INSERT INTO qr_code_sets (id, organization_id, name, language, form_fields, qr_codes, is_active, scan_count, created_at, updated_at) 
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        qrSetStmt.run(setId, orgId, lane, 'en', formFields, qrCodes, 1, 0, now, now)

        qrSets.push({ id: setId, qrCodeId, token })
      }

      console.log(`  ✅ ${qrSets.length} QR code lanes created`)

      // Create registrations
      const numRegs = randNum(15, 20)
      for (let i = 0; i < numRegs; i++) {
        const firstName = rand(FIRST_NAMES)
        const lastName = rand(LAST_NAMES)
        const city = rand(CITIES)
        const qrSet = rand(qrSets)
        const isCheckedIn = Math.random() > 0.3

        const registrationData = JSON.stringify({
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          phone: `(555) ${randNum(200,999)}-${randNum(1000,9999)}`,
          address: `${randNum(100,9999)} ${rand(STREETS)}`,
          city: city.name,
          state: city.state,
          zipCode: city.zip,
          familySize: randNum(1,6)
        })

        const regStmt = db.prepare(`INSERT INTO registrations (id, organization_id, qr_code_set_id, qr_code_id, registration_data, check_in_token, token_status, checked_in_at, delivery_status, registered_at) 
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        regStmt.run(
          crypto.randomUUID(),
          orgId,
          qrSet.id,
          qrSet.qrCodeId,
          registrationData,
          crypto.randomBytes(32).toString('hex'),
          isCheckedIn ? 'used' : 'active',
          isCheckedIn ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          'delivered',
          new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
        )

        totalRegs++
      }

      console.log(`  ✅ ${numRegs} registrations created`)
    }

    console.log(`\n${"=".repeat(60)}`)
    console.log(`🎉 SEEDING COMPLETE!`)
    console.log(`${"=".repeat(60)}`)
    console.log(`\n📊 Summary:`)
    console.log(`   • Organizations: ${ORGANIZATIONS.length}`)
    console.log(`   • Total Registrations: ${totalRegs}`)
    console.log(`\n🔑 Login Credentials:`)
    console.log(`${"=".repeat(60)}`)
    credentials.forEach(c => {
      console.log(`\n🏢 ${c.org}`)
      console.log(`   Email: ${c.email}`)
      console.log(`   Password: ${c.password}`)
      console.log(`   Login: http://localhost:7777/auth/login`)
    })
    console.log(`\n${"=".repeat(60)}`)

  } catch (error) {
    console.error("\n❌ Error:", error)
    throw error
  } finally {
    db.close()
  }
}

seed()
  .then(() => {
    console.log("\n✅ Done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Failed:", error)
    process.exit(1)
  })
