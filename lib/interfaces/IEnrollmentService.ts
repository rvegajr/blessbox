// IEnrollmentService - Interface Segregation Principle Compliant
// Single responsibility: Enroll/remove participants in classes with capacity awareness
//
// Issue: #30 - capacity limit enforcement and duplicate handling

export type EnrollmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended';

export interface EnrollmentRecord {
  id: string;
  participant_id: string;
  class_id: string;
  session_id?: string;
  enrollment_status: EnrollmentStatus;
  enrolled_at: string;
  confirmed_at?: string;
  attended_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentCreateInput {
  participant_id: string;
  class_id: string;
  session_id?: string;
  enrollment_status: EnrollmentStatus;
  enrolled_at: string;
  notes?: string;
}

export interface EnrollmentResult {
  success: boolean;
  enrollment?: EnrollmentRecord;
  error?: 'capacity_reached' | 'already_enrolled' | 'invalid_input' | 'unknown';
  message?: string;
}

/** Read-only enrollment queries (rosters, counts, reports). */
export interface IEnrollmentReader {
  getEnrollment(id: string): Promise<EnrollmentRecord | null>;
  getEnrollmentByParticipant(classId: string, participantId: string): Promise<EnrollmentRecord | null>;
  getEnrollmentsByClass(classId: string): Promise<EnrollmentRecord[]>;
  countActiveEnrollments(classId: string): Promise<number>;
}

/** Capacity-aware enrollment write surface. */
export interface IEnrollmentWriter {
  /**
   * Capacity-bounded enroll. Returns structured result so UI can render
   * the right error (capacity vs duplicate vs unknown) without throwing.
   */
  enrollWithCapacity(input: EnrollmentCreateInput, capacity: number | null): Promise<EnrollmentResult>;
  updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<EnrollmentRecord>;
  /** Matches existing ClassService.deleteEnrollment so the implementation can adopt this interface. */
  deleteEnrollment(id: string): Promise<void>;
}

export interface IEnrollmentService extends IEnrollmentReader, IEnrollmentWriter {}
