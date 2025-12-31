/**
 * Utility to parse registration data and extract meaningful field values
 * 
 * Registration data is stored with field IDs as keys (e.g., Field_1766983402527)
 * This utility maps those IDs to semantic values using form field definitions
 */

export interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
}

/**
 * Extract name from registration data
 * Tries multiple strategies to find a name value
 */
export function extractName(registrationData: Record<string, any>, formFields?: FormField[]): string {
  // Strategy 1: Check for semantic keys
  if (registrationData.name) return registrationData.name;
  if (registrationData.firstName || registrationData.lastName) {
    return [registrationData.firstName, registrationData.lastName].filter(Boolean).join(' ');
  }
  
  // Strategy 2: Use form fields to find name-like fields
  if (formFields) {
    for (const field of formFields) {
      const label = field.label.toLowerCase();
      const value = registrationData[field.id];
      
      if (value) {
        // Check for full name field
        if (label.includes('name') && !label.includes('first') && !label.includes('last')) {
          return value;
        }
      }
    }
    
    // Check for first name + last name combination
    const firstNameField = formFields.find(f => f.label.toLowerCase().includes('first'));
    const lastNameField = formFields.find(f => f.label.toLowerCase().includes('last'));
    
    if (firstNameField || lastNameField) {
      const firstName = firstNameField ? registrationData[firstNameField.id] : '';
      const lastName = lastNameField ? registrationData[lastNameField.id] : '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      if (fullName) return fullName;
    }
  }
  
  // Strategy 3: Try to find any field with "name" in the label
  for (const [key, value] of Object.entries(registrationData)) {
    if (key.toLowerCase().includes('name') && typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  
  return '-';
}

/**
 * Extract email from registration data
 */
export function extractEmail(registrationData: Record<string, any>, formFields?: FormField[]): string {
  // Strategy 1: Check for semantic key
  if (registrationData.email) return registrationData.email;
  
  // Strategy 2: Use form fields to find email field
  if (formFields) {
    const emailField = formFields.find(f => 
      f.type === 'email' || f.label.toLowerCase().includes('email')
    );
    if (emailField) {
      const value = registrationData[emailField.id];
      if (value) return value;
    }
  }
  
  // Strategy 3: Try to find any field with "email" in the key
  for (const [key, value] of Object.entries(registrationData)) {
    if (key.toLowerCase().includes('email') && typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  
  // Strategy 4: Look for email-like values (contains @)
  for (const value of Object.values(registrationData)) {
    if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
      return value;
    }
  }
  
  return '-';
}

/**
 * Extract phone from registration data
 */
export function extractPhone(registrationData: Record<string, any>, formFields?: FormField[]): string {
  // Strategy 1: Check for semantic key
  if (registrationData.phone) return registrationData.phone;
  
  // Strategy 2: Use form fields
  if (formFields) {
    const phoneField = formFields.find(f => 
      f.type === 'phone' || f.label.toLowerCase().includes('phone')
    );
    if (phoneField) {
      const value = registrationData[phoneField.id];
      if (value) return value;
    }
  }
  
  // Strategy 3: Try to find any field with "phone" in the key
  for (const [key, value] of Object.entries(registrationData)) {
    if (key.toLowerCase().includes('phone') && typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  
  return '-';
}

/**
 * Get field value by label
 */
export function getFieldValueByLabel(
  registrationData: Record<string, any>,
  label: string,
  formFields?: FormField[]
): string {
  if (!formFields) return '-';
  
  const field = formFields.find(f => f.label.toLowerCase() === label.toLowerCase());
  if (field) {
    const value = registrationData[field.id];
    if (value !== undefined && value !== null) {
      return String(value);
    }
  }
  
  return '-';
}

/**
 * Parse all registration data into a display-friendly format
 */
export function parseRegistrationData(
  registrationData: Record<string, any>,
  formFields?: FormField[]
): {
  name: string;
  email: string;
  phone: string;
  fields: Array<{ label: string; value: string }>;
} {
  const name = extractName(registrationData, formFields);
  const email = extractEmail(registrationData, formFields);
  const phone = extractPhone(registrationData, formFields);
  
  const fields: Array<{ label: string; value: string }> = [];
  
  if (formFields) {
    for (const field of formFields) {
      const value = registrationData[field.id];
      if (value !== undefined && value !== null) {
        fields.push({
          label: field.label,
          value: String(value),
        });
      }
    }
  }
  
  return { name, email, phone, fields };
}

