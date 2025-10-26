# 🎯 E2E Testing with Browser MCP - Complete Workflow

## 📊 **Current Status**

✅ **Database**: Fully seeded with 4 organizations, 72 users, 14 QR code lanes  
⚠️ **Server**: Needs to be started manually  
⏳ **E2E Testing**: Ready to begin once server is running  

## 🚀 **Server Startup**

### Option 1: Enhanced start.sh (Recommended)
```bash
cd /Users/xcode/Documents/YOLOProjects/BlessBox
./start.sh
```

### Option 2: Direct NPM
```bash
cd /Users/xcode/Documents/YOLOProjects/BlessBox  
./node_modules/.bin/next dev --port 7777
```

### Option 3: System NPM
```bash
cd /Users/xcode/Documents/YOLOProjects/BlessBox
npm run dev
```

### Verify Server is Running
```bash
curl http://localhost:7777
# or
lsof -i :7777
```

## 🎬 **E2E Testing Workflow with Browser MCP**

### Phase 1: Organization Admin Login & Dashboard

**Test Case 1.1: Login to Hope Community Food Bank**
1. Navigate to `http://localhost:7777/auth/login`
2. Enter credentials:
   - Email: `admin@hopefoodbank.org`
   - Password: `Demo123!`
3. Click "Sign In"
4. **Expected**: Redirect to dashboard showing:
   - Organization name: "Hope Community Food Bank"
   - Total registrations: 15
   - QR code lanes: 4
   - Recent activity feed

**Test Case 1.2: View QR Code Lanes**
1. From dashboard, navigate to QR Codes section
2. **Expected**: See 4 QR code sets:
   - Main Entrance
   - Side Door
   - Drive-Through
   - Express Lane
3. Each should show:
   - QR code image
   - Scan count
   - Registration count
   - Active/Inactive status

**Test Case 1.3: View Registration List**
1. Navigate to Registrations page
2. **Expected**: See list of 15 registrations with:
   - Name
   - Email
   - Phone
   - Address (Street, City, State, ZIP)
   - Family Size
   - QR Lane Used
   - Registration Date
   - Check-in Status (70% checked in, 30% pending)
3. Test filtering by:
   - QR Lane
   - Check-in status
   - Date range

**Test Case 1.4: View Analytics**
1. Navigate to Analytics/Dashboard
2. **Expected**: See:
   - Total registrations: 15
   - Checked in: ~11 (70%)
   - Pending: ~4 (30%)
   - Registrations by lane:
     - Main Entrance: ~4
     - Side Door: ~4
     - Drive-Through: ~4
     - Express Lane: ~3
   - Registration timeline chart (past 14 days)
   - Check-in timeline chart (past 7 days)

### Phase 2: Test Multiple Organizations

**Test Case 2.1: Login to Tech Summit**
1. Sign out from Food Bank
2. Login with: `registration@techsummit.org` / `Demo123!`
3. **Expected**: Different dashboard showing:
   - Organization: "Tech Skills Summit 2025"
   - Registrations: 18
   - QR Lanes: 3 (Desk A, Desk B, VIP)

**Test Case 2.2: Verify Data Isolation**
1. Confirm Tech Summit sees ONLY their 18 users
2. Confirm NO overlap with Food Bank data
3. Verify QR lanes are specific to Tech Summit

**Test Case 2.3: Login to Volunteer Center**
1. Sign out
2. Login with: `coordinator@greenvalley.org` / `Demo123!`
3. **Expected**:
   - Organization: "Green Valley Volunteer Center"
   - Registrations: 20 (highest)
   - QR Lanes: 3

**Test Case 2.4: Login to Health Clinic**
1. Sign out
2. Login with: `intake@downtownhealth.org` / `Demo123!`
3. **Expected**:
   - Organization: "Downtown Health Clinic"
   - Registrations: 19
   - QR Lanes: 4

### Phase 3: QR Code Registration Flow (Simulation)

**Test Case 3.1: Scan QR Code (Main Entrance)**
1. From Food Bank dashboard, get QR code for "Main Entrance"
2. Extract QR code token from database:
   ```bash
   sqlite3 blessbox.db "SELECT qr_codes FROM qr_code_sets 
   WHERE organization_id = (SELECT id FROM organizations WHERE name = 'Hope Community Food Bank')
   AND name = 'Main Entrance'"
   ```
3. Navigate to registration URL (would be encoded in QR)
4. **Expected**: Registration form with fields:
   - Full Name
   - Email
   - Phone
   - Address
   - City
   - State
   - ZIP Code
   - Family Size

**Test Case 3.2: Submit New Registration**
1. Fill out form with test data:
   ```
   Name: Test User
   Email: test@example.com
   Phone: (555) 999-9999
   Address: 123 Test St
   City: TestCity
   State: TS
   ZIP: 12345
   Family Size: 3
   ```
2. Submit form
3. **Expected**:
   - Success message
   - Display unique check-in QR code
   - Token status: "active"
   - Message: "Show this QR code to staff for check-in"

**Test Case 3.3: Staff Check-in**
1. Login as Food Bank admin
2. Navigate to Check-in interface
3. Scan/enter the check-in token from previous test
4. **Expected**:
   - Display user information
   - Show "Check In" button
   - Click to confirm check-in
   - Token status changes to "used"
   - Check-in timestamp recorded

### Phase 4: Lane-Specific Analytics

**Test Case 4.1: Main Entrance Stats**
1. View Main Entrance QR code details
2. **Expected**:
   - Total scans: ~4
   - Registrations: ~4
   - Check-ins: ~3 (70%)
   - List of users who used this entrance

**Test Case 4.2: Compare Lanes**
1. View all 4 lanes side-by-side
2. **Expected**:
   - Traffic distribution visualization
   - Peak times per lane
   - Check-in success rate per lane

### Phase 5: Address Data Verification

**Test Case 5.1: Export Registration Data**
1. From dashboard, click "Export Data"
2. Select format: CSV
3. **Expected**: Download contains:
   - All 15 registrations
   - Complete address fields:
     - Street address
     - City
     - State
     - ZIP Code
   - All fields properly formatted

**Test Case 5.2: View Individual Registration**
1. Click on any registration
2. **Expected**: Detailed view showing:
   ```
   Name: Patricia Martinez
   Email: patricia.martinez@example.com
   Phone: (555) 836-5257
   Address: 5602 Cedar Ln
   City: Portland
   State: OR
   ZIP Code: 97201
   Family Size: 4
   QR Lane: Side Door
   Registered: [timestamp]
   Checked In: Yes
   Checked In At: [timestamp]
   ```

### Phase 6: Multi-Organization Comparison

**Test Case 6.1: Compare Registration Counts**
- Food Bank: 15 users
- Tech Summit: 18 users
- Volunteer Center: 20 users
- Health Clinic: 19 users

**Test Case 6.2: Compare Lane Counts**
- Food Bank: 4 lanes
- Tech Summit: 3 lanes
- Volunteer Center: 3 lanes
- Health Clinic: 4 lanes

**Test Case 6.3: Verify Total**
- Combined: 72 total registrations
- Combined: 14 total QR lanes
- All users have complete address data

## 📋 **Browser MCP Commands**

### Navigate to Login
```javascript
await browser_navigate({ url: "http://localhost:7777/auth/login" })
```

### Fill Login Form
```javascript
await browser_fill_form({
  fields: [
    { name: "Email", type: "textbox", ref: "email-input", value: "admin@hopefoodbank.org" },
    { name: "Password", type: "textbox", ref: "password-input", value: "Demo123!" }
  ]
})
```

### Click Sign In
```javascript
await browser_click({ element: "Sign In button", ref: "signin-button" })
```

### Take Screenshot
```javascript
await browser_take_screenshot({ filename: "dashboard-view.png" })
```

### Verify Dashboard Content
```javascript
await browser_snapshot()
// Check for:
// - Organization name
// - Registration count
// - QR code count
```

## ✅ **Expected Results Summary**

### Data Integrity
- ✅ 4 organizations with unique data
- ✅ 72 total registrations
- ✅ 14 QR code lanes
- ✅ All users have complete addresses
- ✅ 70% check-in rate
- ✅ Data isolated per organization

### Functionality
- ✅ Login/logout works
- ✅ Dashboard displays correct stats
- ✅ QR codes are accessible
- ✅ Registration list shows all users
- ✅ Analytics display correctly
- ✅ Lane-specific data visible
- ✅ Address data complete and formatted

### User Experience
- ✅ Responsive design
- ✅ Clear navigation
- ✅ Data export works
- ✅ Real-time updates (if applicable)
- ✅ Error handling

## 🔧 **Troubleshooting**

### Server Won't Start
```bash
# Check if port is in use
lsof -i :7777

# Kill existing process
kill -9 $(lsof -t -i:7777)

# Check node_modules exists
ls -la node_modules

# Reinstall if needed
npm install --legacy-peer-deps

# Check for errors
./node_modules/.bin/next dev --port 7777
```

### Database Issues
```bash
# Verify data
sqlite3 blessbox.db "SELECT COUNT(*) FROM registrations"
# Should return: 72

# Re-seed if needed
node scripts/seed-simple.js
```

### Browser MCP Issues
```bash
# Check MCP is running
ps aux | grep mcp

# Restart browser MCP if needed
```

## 📊 **Test Data Reference**

### Organization 1: Hope Community Food Bank
- **Email**: admin@hopefoodbank.org
- **Password**: Demo123!
- **Users**: 15
- **Lanes**: Main Entrance, Side Door, Drive-Through, Express Lane
- **Purpose**: Food distribution

### Organization 2: Tech Skills Summit 2025
- **Email**: registration@techsummit.org
- **Password**: Demo123!
- **Users**: 18
- **Lanes**: Registration Desk A, Registration Desk B, VIP Check-In
- **Purpose**: Conference registration

### Organization 3: Green Valley Volunteer Center
- **Email**: coordinator@greenvalley.org
- **Password**: Demo123!
- **Users**: 20
- **Lanes**: Orientation Station, Skills Assessment, Project Assignment
- **Purpose**: Volunteer coordination

### Organization 4: Downtown Health Clinic
- **Email**: intake@downtownhealth.org
- **Password**: Demo123!
- **Users**: 19
- **Lanes**: Triage, Insurance, General, Urgent Care
- **Purpose**: Patient intake

## 🎯 **Success Criteria**

- [ ] All 4 organizations can login
- [ ] Each sees only their own data
- [ ] Registration counts match (15, 18, 20, 19)
- [ ] QR lane counts match (4, 3, 3, 4)
- [ ] All users have complete address data
- [ ] Check-in status is realistic (~70%)
- [ ] Analytics display correctly
- [ ] Data can be exported
- [ ] No cross-organization data leakage

---

## 🚀 **Ready to Test!**

Once the server is running on port 7777, use browser MCP to go through these test cases systematically. The database is fully populated and waiting for your E2E testing!

**Start server and begin testing:** ✅

