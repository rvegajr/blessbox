import { getDbClient } from '../lib/db';

async function checkSuperAdmin() {
  const db = getDbClient();
  
  const result = await db.execute({ 
    sql: 'SELECT email, role FROM users WHERE role = ? LIMIT 5', 
    args: ['super_admin'] 
  });
  
  console.log('Super admin users:', JSON.stringify(result.rows, null, 2));
  
  if (result.rows.length === 0) {
    console.log('\n⚠️  No super admin found!');
    console.log('Checking all users with "admin" in role:');
    const allAdmins = await db.execute({ 
      sql: 'SELECT email, role FROM users', 
      args: [] 
    });
    console.log('All users:', JSON.stringify(allAdmins.rows, null, 2));
  }
}

checkSuperAdmin().catch(console.error);

