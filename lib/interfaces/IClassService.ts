// IClassService - Interface Segregation Principle Compliant
// Single responsibility: Class CRUD + capacity-aware queries
//
// Issue: #30 - Classes and participant enrollment management
//
// Following ISP: split read/write/admin so consumers depend only on what they use.

export interface ClassRecord {
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

export interface ClassCreateInput {
  organization_id: string;
  name: string;
  description?: string;
  capacity: number;
  timezone: string;
  status: 'active' | 'inactive' | 'cancelled';
}

export interface ClassUpdateInput {
  name?: string;
  description?: string;
  capacity?: number;
  timezone?: string;
  status?: 'active' | 'inactive' | 'cancelled';
}

/**
 * Read-only operations for class data.
 * Consumers that only display classes should depend on this segregated interface.
 */
export interface IClassReader {
  getClass(id: string): Promise<ClassRecord | null>;
  getClassesByOrganization(organizationId: string): Promise<ClassRecord[]>;
  countActiveEnrollments(classId: string): Promise<number>;
}

/**
 * Write-only operations for class data.
 * Admin/management UIs depend on this for create/update/delete actions.
 */
export interface IClassWriter {
  createClass(data: ClassCreateInput): Promise<ClassRecord>;
  updateClass(id: string, updates: ClassUpdateInput): Promise<ClassRecord>;
  deleteClass(id: string): Promise<void>;
}

/**
 * Combined interface for full class management.
 * Composition: IClassService = IClassReader + IClassWriter
 */
export interface IClassService extends IClassReader, IClassWriter {}
