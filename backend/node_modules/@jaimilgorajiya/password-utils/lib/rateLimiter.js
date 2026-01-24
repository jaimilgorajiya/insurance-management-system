const attempts = {};

/**
 * Simple in-memory rate limiter for login attempts
 * @param {string} identifier - Unique identifier (e.g., email or IP)
 * @param {number} maxAttempts - Maximum allowed attempts (default 5)
 * @param {number} windowMs - Time window in milliseconds (default 60000 aka 1 min)
 * @returns {{allowed: boolean, message?: string}}
 */
const loginRateLimiter = (identifier, maxAttempts = 5, windowMs = 60000) => {
  const now = Date.now();
  if (!attempts[identifier]) attempts[identifier] = [];
  
  // Filter out old attempts
  attempts[identifier] = attempts[identifier].filter(
    (time) => now - time < windowMs
  );

  if (attempts[identifier].length >= maxAttempts) {
    return { allowed: false, message: "Too many attempts. Try again later." };
  }

  // Add current attempt
  attempts[identifier].push(now);
  return { allowed: true };
};

module.exports = { 
  loginRateLimiter,
  // Alias for backward compatibility if needed, though likely not used directly given previous state
  rateLimiter: loginRateLimiter
};
