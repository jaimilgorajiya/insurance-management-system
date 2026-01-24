import cjs from './index.js';

export const hashPassword = cjs.hashPassword;
export const comparePassword = cjs.comparePassword;
export const validatePassword = cjs.validatePassword;
export const loginRateLimiter = cjs.loginRateLimiter;

// Aliases
export const compare = cjs.compare;
export const verifyPassword = cjs.verifyPassword;
export const rateLimiter = cjs.rateLimiter;

export default cjs;
