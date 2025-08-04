/**
 * Onboarding API interfaces
 * Contract-first API design
 */

import { IOrganizationSetup } from '../components/IOrganizationData';
import { IFormField } from '../components/IFormBuilder';
import { IQRCodeConfig } from '../components/IQRCode';

/**
 * Base API response
 */
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: IApiError;
}

/**
 * API error interface
 */
export interface IApiError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

/**
 * Organization setup request
 */
export interface IOrganizationSetupRequest {
  sessionId: string;
  organization: IOrganizationSetup;
}

/**
 * Organization setup response
 */
export interface IOrganizationSetupResponse {
  sessionId: string;
  nextStep: string;
}

/**
 * Email verification send request
 */
export interface IVerificationSendRequest {
  sessionId: string;
  email: string;
}

/**
 * Email verification send response
 */
export interface IVerificationSendResponse {
  success: boolean;
  expiresAt: number;
}

/**
 * Email verification confirm request
 */
export interface IVerificationConfirmRequest {
  sessionId: string;
  code: string;
}

/**
 * Email verification confirm response
 */
export interface IVerificationConfirmResponse {
  success: boolean;
  token: string;
}

/**
 * Form configuration request
 */
export interface IFormConfigRequest {
  sessionId: string;
  fields: IFormField[];
}

/**
 * Form configuration response
 */
export interface IFormConfigResponse {
  success: boolean;
  formId: string;
}

/**
 * QR code configuration request
 */
export interface IQRConfigRequest {
  sessionId: string;
  qrCodes: Omit<IQRCodeConfig, 'id' | 'createdAt'>[];
  defaultLanguage: string;
}

/**
 * QR code configuration response
 */
export interface IQRConfigResponse {
  success: boolean;
  qrCodeIds: string[];
}

/**
 * Complete onboarding request
 */
export interface ICompleteOnboardingRequest {
  sessionId: string;
  verificationToken: string;
}

/**
 * Complete onboarding response
 */
export interface ICompleteOnboardingResponse {
  success: boolean;
  organizationId: string;
  dashboardUrl: string;
}