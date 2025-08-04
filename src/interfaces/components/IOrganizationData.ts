/**
 * Interface for basic organization data
 * Following Interface Segregation Principle - only contains organization-specific data
 */
export interface IOrganizationData {
  name: string;
  eventName: string;
  customDomain: string;
}

/**
 * Interface for contact information
 * Segregated from organization data for single responsibility
 */
export interface IContactInfo {
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Combined interface for complete organization setup
 */
export interface IOrganizationSetup extends IOrganizationData, IContactInfo {
  id?: string;
  createdAt?: Date;
  verifiedAt?: Date;
}