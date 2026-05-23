// IParticipantService - Interface Segregation Principle Compliant
// Single responsibility: Participant CRUD per organization
//
// Issue: #30 - Aracela's notes #2 (no edit/delete action for participants)

export interface ParticipantRecord {
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

export interface ParticipantCreateInput {
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
  status: 'active' | 'inactive';
}

export interface ParticipantUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
  status?: 'active' | 'inactive';
}

/** Read-only participant queries (used by lists and dropdowns). */
export interface IParticipantReader {
  getParticipant(id: string): Promise<ParticipantRecord | null>;
  getParticipantsByOrganization(organizationId: string): Promise<ParticipantRecord[]>;
  findParticipantByEmail(organizationId: string, email: string): Promise<ParticipantRecord | null>;
}

/** Write operations for participant management. */
export interface IParticipantWriter {
  createParticipant(data: ParticipantCreateInput): Promise<ParticipantRecord>;
  updateParticipant(id: string, updates: ParticipantUpdateInput): Promise<ParticipantRecord>;
  deleteParticipant(id: string): Promise<void>;
}

export interface IParticipantService extends IParticipantReader, IParticipantWriter {}
