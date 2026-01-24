/**
 * Hashes a plain password using bcrypt.
 * @param password The plain text password to hash.
 * @param saltRounds The number of salt rounds to use (default 10).
 */
export function hashPassword(password: string, saltRounds?: number): Promise<string>;

/**
 * Compares a plain password with a hashed password.
 * @param password The plain text password.
 * @param hashedPassword The hashed password to compare against.
 */
export function comparePassword(password: string, hashedPassword: string): Promise<boolean>;

/**
 * Alias for comparePassword.
 * Compares a plain password with a hashed password.
 * @param password The plain text password.
 * @param hashedPassword The hashed password to compare against.
 */
export function compare(password: string, hashedPassword: string): Promise<boolean>;

/**
 * @deprecated Use comparePassword instead.
 */
export function verifyPassword(password: string, hashedPassword: string): Promise<boolean>;

export interface ValidationResult {
    valid: boolean;
    isValid: boolean;
    errors: string[];
}

/**
 * Validates a password against security rules.
 * @param password The password to validate.
 */
export function validatePassword(password: string): ValidationResult;

export interface RateLimitResult {
    allowed: boolean;
    message?: string;
}

/**
 * A simple in-memory rate limiter.
 * @param identifier Unique identifier for the user (e.g., email or IP).
 * @param maxAttempts Maximum allowed attempts (default 5).
 * @param windowMs Time window in milliseconds (default 60000ms / 1 min).
 */
export function loginRateLimiter(identifier: string, maxAttempts?: number, windowMs?: number): RateLimitResult;

/**
 * @deprecated Use loginRateLimiter instead.
 */
export function rateLimiter(identifier: string, maxAttempts?: number, windowMs?: number): RateLimitResult;
