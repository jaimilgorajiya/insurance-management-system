const { hashPassword } = require("./lib/hash");
const { comparePassword, verifyPassword } = require("./lib/compare");
const { validatePassword } = require("./lib/validate");
const { loginRateLimiter, rateLimiter } = require("./lib/rateLimiter");

module.exports = {
  hashPassword,
  comparePassword,
  validatePassword,
  loginRateLimiter,
  // Aliases
  compare: comparePassword,      // Shorter alias requested by user
  verifyPassword, // Legacy alias
  rateLimiter     // Legacy alias
};
