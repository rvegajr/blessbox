import { getDbClient } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface Class {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  capacity: number;
  timezone: string;
  status: 'active' | 'inactive' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  session_date: string; // YYYY-MM-DD
  session_time: string; // HH:MM
  duration_minutes: number;
  location?: string;
  instructor_name?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  participant_id: string;
  class_id: string;
  session_id?: string;
  enrollment_status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  enrolled_at: string;
  confirmed_at?: string;
  attended_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class ClassService {
  private db = getDbClient();

  // Class Management
  async createClass(data: Omit<Class, 'id' | 'created_at' | 'updated_at'>): Promise<Class> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.execute({
      sql: `INSERT INTO classes (id, organization_id, name, description, capacity, timezone, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, data.organization_id, data.name, data.description || null, data.capacity, data.timezone, data.status, now, now]
    });

    return this.getClass(id) as Promise<Class>;
  }

  async getClass(id: string): Promise<Class | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM classes WHERE id = ?',
      args: [id]
    });

    return result.rows[0] as Class || null;
  }

  async getClassesByOrganization(organizationId: string): Promise<Class[]> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM classes WHERE organization_id = ? ORDER BY created_at DESC',
      args: [organizationId]
    });

    return result.rows as Class[];
  }

  async updateClass(id: string, updates: Partial<Omit<Class, 'id' | 'created_at' | 'updated_at'>>): Promise<Class> {
    const setClause = [];
    const args = [];

    if (updates.name !== undefined) {
      setClause.push('name = ?');
      args.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClause.push('description = ?');
      args.push(updates.description);
    }
    if (updates.capacity !== undefined) {
      setClause.push('capacity = ?');
      args.push(updates.capacity);
    }
    if (updates.timezone !== undefined) {
      setClause.push('timezone = ?');
      args.push(updates.timezone);
    }
    if (updates.status !== undefined) {
      setClause.push('status = ?');
      args.push(updates.status);
    }

    setClause.push('updated_at = ?');
    args.push(new Date().toISOString());
    args.push(id);

    await this.db.execute({
      sql: `UPDATE classes SET ${setClause.join(', ')} WHERE id = ?`,
      args: args
    });

    return this.getClass(id) as Promise<Class>;
  }

  // Session Management
  async createSession(data: Omit<ClassSession, 'id' | 'created_at' | 'updated_at'>): Promise<ClassSession> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.execute({
      sql: `INSERT INTO class_sessions (id, class_id, session_date, session_time, duration_minutes, location, instructor_name, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, data.class_id, data.session_date, data.session_time, data.duration_minutes, data.location || null, data.instructor_name || null, data.status, now, now]
    });

    return this.getSession(id) as Promise<ClassSession>;
  }

  async getSession(id: string): Promise<ClassSession | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM class_sessions WHERE id = ?',
      args: [id]
    });

    return result.rows[0] as ClassSession || null;
  }

  async getSessionsByClass(classId: string): Promise<ClassSession[]> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM class_sessions WHERE class_id = ? ORDER BY session_date, session_time',
      args: [classId]
    });

    return result.rows as ClassSession[];
  }

  // Participant Management
  async createParticipant(data: Omit<Participant, 'id' | 'created_at' | 'updated_at'>): Promise<Participant> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.execute({
      sql: `INSERT INTO participants (id, organization_id, first_name, last_name, email, phone, emergency_contact, emergency_phone, notes, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, data.organization_id, data.first_name, data.last_name, data.email, data.phone || null, data.emergency_contact || null, data.emergency_phone || null, data.notes || null, data.status, now, now]
    });

    return this.getParticipant(id) as Promise<Participant>;
  }

  async getParticipant(id: string): Promise<Participant | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM participants WHERE id = ?',
      args: [id]
    });

    return result.rows[0] as Participant || null;
  }

  async getParticipantsByOrganization(organizationId: string): Promise<Participant[]> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM participants WHERE organization_id = ? ORDER BY created_at DESC',
      args: [organizationId]
    });

    return result.rows as Participant[];
  }

  // Enrollment Management
  async enrollParticipant(data: Omit<Enrollment, 'id' | 'created_at' | 'updated_at'>): Promise<Enrollment> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.execute({
      sql: `INSERT INTO enrollments (id, participant_id, class_id, session_id, enrollment_status, enrolled_at, confirmed_at, attended_at, notes, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, data.participant_id, data.class_id, data.session_id || null, data.enrollment_status, data.enrolled_at, data.confirmed_at || null, data.attended_at || null, data.notes || null, now, now]
    });

    return this.getEnrollment(id) as Promise<Enrollment>;
  }

  async getEnrollment(id: string): Promise<Enrollment | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM enrollments WHERE id = ?',
      args: [id]
    });

    return result.rows[0] as Enrollment || null;
  }

  async getEnrollmentsByClass(classId: string): Promise<Enrollment[]> {
    const result = await this.db.execute({
      sql: `SELECT e.*, p.first_name, p.last_name, p.email 
            FROM enrollments e 
            JOIN participants p ON e.participant_id = p.id 
            WHERE e.class_id = ? 
            ORDER BY e.enrolled_at DESC`,
      args: [classId]
    });

    return result.rows as Enrollment[];
  }

  async updateEnrollmentStatus(id: string, status: Enrollment['enrollment_status']): Promise<Enrollment> {
    const now = new Date().toISOString();
    let confirmed_at = null;
    let attended_at = null;

    if (status === 'confirmed') {
      confirmed_at = now;
    } else if (status === 'attended') {
      attended_at = now;
    }

    await this.db.execute({
      sql: `UPDATE enrollments SET enrollment_status = ?, confirmed_at = ?, attended_at = ?, updated_at = ? WHERE id = ?`,
      args: [status, confirmed_at, attended_at, now, id]
    });

    return this.getEnrollment(id) as Promise<Enrollment>;
  }

  // Analytics
  async getClassStats(classId: string): Promise<{
    totalEnrollments: number;
    confirmedEnrollments: number;
    attendedEnrollments: number;
    pendingEnrollments: number;
  }> {
    const result = await this.db.execute({
      sql: `SELECT 
              COUNT(*) as totalEnrollments,
              SUM(CASE WHEN enrollment_status = 'confirmed' THEN 1 ELSE 0 END) as confirmedEnrollments,
              SUM(CASE WHEN enrollment_status = 'attended' THEN 1 ELSE 0 END) as attendedEnrollments,
              SUM(CASE WHEN enrollment_status = 'pending' THEN 1 ELSE 0 END) as pendingEnrollments
            FROM enrollments 
            WHERE class_id = ?`,
      args: [classId]
    });

    return result.rows[0] as any;
  }
}

