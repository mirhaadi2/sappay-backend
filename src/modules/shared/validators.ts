// Custom validation functions without external dependencies
// This ensures zero external dependency requirements for core validation

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Basic type validators
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required and must be a string' });
    return { valid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (email.length > 255) {
    errors.push({ field: 'email', message: 'Email must be at most 255 characters' });
  }

  return { valid: errors.length === 0, errors };
}

export function validatePassword(password: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required and must be a string' });
    return { valid: false, errors };
  }

  if (password.length < 12) {
    errors.push({ field: 'password', message: 'Password must be at least 12 characters' });
  }

  if (!/[A-Z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
  }

  if (!/[a-z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
  }

  if (!/[0-9]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one number' });
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one special character' });
  }

  // Check for common passwords
  const commonPasswords = ['Pass@123456', 'Admin@123456', 'Test@123456', 'Demo@123456'];
  if (commonPasswords.includes(password)) {
    errors.push({ field: 'password', message: 'Password is too common' });
  }

  return { valid: errors.length === 0, errors };
}

export function validateString(value: string, fieldName: string, min = 2, max = 255): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value || typeof value !== 'string') {
    errors.push({ field: fieldName, message: `${fieldName} is required and must be a string` });
    return { valid: false, errors };
  }

  if (value.length < min) {
    errors.push({ field: fieldName, message: `${fieldName} must be at least ${min} characters` });
  }

  if (value.length > max) {
    errors.push({ field: fieldName, message: `${fieldName} must be at most ${max} characters` });
  }

  return { valid: errors.length === 0, errors };
}

export function validateUUID(value: string, fieldName = 'id'): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value || typeof value !== 'string') {
    errors.push({ field: fieldName, message: `${fieldName} is required and must be a string` });
    return { valid: false, errors };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    errors.push({ field: fieldName, message: `Invalid ${fieldName} format. Must be a valid UUID` });
  }

  return { valid: errors.length === 0, errors };
}

export function validateEnum(value: string, fieldName: string, allowedValues: string[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value || typeof value !== 'string') {
    errors.push({ field: fieldName, message: `${fieldName} is required and must be a string` });
    return { valid: false, errors };
  }

  if (!allowedValues.includes(value)) {
    errors.push({ field: fieldName, message: `${fieldName} must be one of: ${allowedValues.join(', ')}` });
  }

  return { valid: errors.length === 0, errors };
}

export function validateRoleCode(code: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!code || typeof code !== 'string') {
    errors.push({ field: 'code', message: 'Role code is required and must be a string' });
    return { valid: false, errors };
  }

  if (code.length < 3) {
    errors.push({ field: 'code', message: 'Role code must be at least 3 characters' });
  }

  if (code.length > 50) {
    errors.push({ field: 'code', message: 'Role code must be at most 50 characters' });
  }

  if (!/^[A-Z_]+$/.test(code)) {
    errors.push({ field: 'code', message: 'Role code must contain only uppercase letters and underscores' });
  }

  return { valid: errors.length === 0, errors };
}

// Admin validation schemas
export function validateCreateAdmin(data: any): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Validate email
  let result = validateEmail(data.email);
  allErrors.push(...result.errors);

  // Validate password
  result = validatePassword(data.password);
  allErrors.push(...result.errors);

  // Validate name
  result = validateString(data.name, 'name', 2, 255);
  allErrors.push(...result.errors);

  // Validate phone (optional)
  if (data.phone && typeof data.phone === 'string' && data.phone.length > 20) {
    allErrors.push({ field: 'phone', message: 'Phone must be at most 20 characters' });
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

export function validateUpdateAdmin(data: any): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Ensure at least one field is provided
  if (!data || Object.keys(data).length === 0) {
    allErrors.push({ field: 'data', message: 'At least one field must be provided for update' });
    return { valid: false, errors: allErrors };
  }

  // Validate email (optional)
  if (data.email) {
    const result = validateEmail(data.email);
    allErrors.push(...result.errors);
  }

  // Validate name (optional)
  if (data.name) {
    const result = validateString(data.name, 'name', 2, 255);
    allErrors.push(...result.errors);
  }

  // Validate phone (optional)
  if (data.phone && typeof data.phone === 'string' && data.phone.length > 20) {
    allErrors.push({ field: 'phone', message: 'Phone must be at most 20 characters' });
  }

  // Validate status (optional)
  if (data.status) {
    const result = validateEnum(data.status, 'status', ['active', 'inactive', 'suspended']);
    allErrors.push(...result.errors);
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

// Staff validation schemas
export function validateCreateStaff(data: any): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Validate email
  let result = validateEmail(data.email);
  allErrors.push(...result.errors);

  // Validate password
  result = validatePassword(data.password);
  allErrors.push(...result.errors);

  // Validate name
  result = validateString(data.name, 'name', 2, 255);
  allErrors.push(...result.errors);

  // Validate phone (optional)
  if (data.phone && typeof data.phone === 'string' && data.phone.length > 20) {
    allErrors.push({ field: 'phone', message: 'Phone must be at most 20 characters' });
  }

  // Validate department (optional)
  if (data.department && typeof data.department === 'string' && data.department.length > 100) {
    allErrors.push({ field: 'department', message: 'Department must be at most 100 characters' });
  }

  // Validate manager_id (optional)
  if (data.manager_id) {
    result = validateUUID(data.manager_id, 'manager_id');
    allErrors.push(...result.errors);
  }

  // Validate hire_date (optional)
  if (data.hire_date && !isValidDatetime(data.hire_date)) {
    allErrors.push({ field: 'hire_date', message: 'Invalid hire_date format. Must be ISO 8601 datetime' });
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

export function validateUpdateStaff(data: any): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Ensure at least one field is provided
  if (!data || Object.keys(data).length === 0) {
    allErrors.push({ field: 'data', message: 'At least one field must be provided for update' });
    return { valid: false, errors: allErrors };
  }

  // Validate email (optional)
  if (data.email) {
    const result = validateEmail(data.email);
    allErrors.push(...result.errors);
  }

  // Validate name (optional)
  if (data.name) {
    const result = validateString(data.name, 'name', 2, 255);
    allErrors.push(...result.errors);
  }

  // Validate phone (optional)
  if (data.phone && typeof data.phone === 'string' && data.phone.length > 20) {
    allErrors.push({ field: 'phone', message: 'Phone must be at most 20 characters' });
  }

  // Validate department (optional)
  if (data.department && typeof data.department === 'string' && data.department.length > 100) {
    allErrors.push({ field: 'department', message: 'Department must be at most 100 characters' });
  }

  // Validate manager_id (optional)
  if (data.manager_id) {
    const result = validateUUID(data.manager_id, 'manager_id');
    allErrors.push(...result.errors);
  }

  // Validate hire_date (optional)
  if (data.hire_date && !isValidDatetime(data.hire_date)) {
    allErrors.push({ field: 'hire_date', message: 'Invalid hire_date format. Must be ISO 8601 datetime' });
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

// Role validation schemas
export function validateCreateRole(data: any): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Validate code
  let result = validateRoleCode(data.code);
  allErrors.push(...result.errors);

  // Validate name
  result = validateString(data.name, 'name', 2, 255);
  allErrors.push(...result.errors);

  // Validate description (optional)
  if (data.description && typeof data.description === 'string' && data.description.length > 1000) {
    allErrors.push({ field: 'description', message: 'Description must be at most 1000 characters' });
  }

  // Validate type
  result = validateEnum(data.type, 'type', ['admin', 'staff']);
  allErrors.push(...result.errors);

  // Validate permissionIds (optional)
  if (data.permissionIds) {
    if (!Array.isArray(data.permissionIds)) {
      allErrors.push({ field: 'permissionIds', message: 'permissionIds must be an array' });
    } else {
      for (const id of data.permissionIds) {
        result = validateUUID(id, 'permissionIds');
        if (!result.valid) {
          allErrors.push(...result.errors);
          break;
        }
      }
    }
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

export function validateUpdateRole(data: any): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Ensure at least one field is provided
  if (!data || Object.keys(data).length === 0) {
    allErrors.push({ field: 'data', message: 'At least one field must be provided for update' });
    return { valid: false, errors: allErrors };
  }

  // Validate name (optional)
  if (data.name) {
    const result = validateString(data.name, 'name', 2, 255);
    allErrors.push(...result.errors);
  }

  // Validate description (optional)
  if (data.description && typeof data.description === 'string' && data.description.length > 1000) {
    allErrors.push({ field: 'description', message: 'Description must be at most 1000 characters' });
  }

  // Validate permissionIds (optional)
  if (data.permissionIds) {
    if (!Array.isArray(data.permissionIds)) {
      allErrors.push({ field: 'permissionIds', message: 'permissionIds must be an array' });
    } else {
      for (const id of data.permissionIds) {
        const result = validateUUID(id, 'permissionIds');
        if (!result.valid) {
          allErrors.push(...result.errors);
          break;
        }
      }
    }
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

// Helper function to validate ISO 8601 datetime
function isValidDatetime(dateString: string): boolean {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!isoRegex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
