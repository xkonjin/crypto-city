/**
 * Input Validation and Sanitization
 * Issue #243: Add Input Validation and Sanitization
 * 
 * Provides utilities for validating and sanitizing user input
 * to prevent XSS, injection attacks, and invalid data
 */

/**
 * Sanitize a string by removing HTML tags and dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .trim();
}

/**
 * Validate city name
 * - Must be 1-50 characters
 * - Only alphanumeric, spaces, hyphens, and underscores
 * - No leading/trailing whitespace
 */
export function validateCityName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'City name cannot be empty' };
  }
  
  const sanitized = sanitizeString(name);
  
  if (sanitized.length < 1 || sanitized.length > 50) {
    return { valid: false, error: 'City name must be between 1 and 50 characters' };
  }
  
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(sanitized)) {
    return { valid: false, error: 'City name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }
  
  return { valid: true };
}

/**
 * Validate grid coordinates
 */
export function validateCoordinates(x: number, y: number, gridSize: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return { valid: false, error: 'Coordinates must be integers' };
  }
  
  if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
    return { valid: false, error: `Coordinates must be within grid bounds (0-${gridSize - 1})` };
  }
  
  return { valid: true };
}

/**
 * Validate building placement
 */
export function validateBuildingPlacement(
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  gridSize: number
): { valid: boolean; error?: string } {
  // Validate coordinates
  const coordCheck = validateCoordinates(x, y, gridSize);
  if (!coordCheck.valid) {
    return coordCheck;
  }
  
  // Check if building fits within grid
  if (x + width > gridSize || y + height > gridSize) {
    return { valid: false, error: 'Building does not fit within grid bounds' };
  }
  
  return { valid: true };
}

/**
 * Validate numeric input within range
 */
export function validateNumber(
  value: number, 
  min: number, 
  max: number, 
  name: string = 'Value'
): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `${name} must be a valid number` };
  }
  
  if (value < min || value > max) {
    return { valid: false, error: `${name} must be between ${min} and ${max}` };
  }
  
  return { valid: true };
}

/**
 * Sanitize and validate user message/chat input
 */
export function validateMessage(message: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeString(message);
  
  if (sanitized.length === 0) {
    return { valid: false, sanitized, error: 'Message cannot be empty' };
  }
  
  if (sanitized.length > 500) {
    return { valid: false, sanitized, error: 'Message must be 500 characters or less' };
  }
  
  return { valid: true, sanitized };
}

/**
 * Validate email format (basic check)
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeString(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

/**
 * Validate URL format
 */
export function validateURL(url: string): { valid: boolean; error?: string } {
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
class RateLimiter {
  private attempts = new Map<string, number[]>();
  
  /**
   * Check if action is rate limited
   * @param key - Unique identifier (e.g., user ID, IP address)
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   */
  isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Filter out attempts outside the time window
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return true;
    }
    
    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return false;
  }
  
  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Sanitize object keys and values recursively
 * Useful for sanitizing API responses or user-provided objects
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeString(key);
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[sanitizedKey] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item) :
        item
      );
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  
  return sanitized as T;
}
