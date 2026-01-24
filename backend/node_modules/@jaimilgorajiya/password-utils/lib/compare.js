const bcrypt = require("bcryptjs");

/**
 * Compare plain password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from DB
 * @returns {Promise<boolean>} True if match, false otherwise
 */
const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword)
    throw new Error("Both password and hashedPassword are required");
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = { 
  comparePassword,
  // Alias for backward compatibility if anyone was using it internal imports
  verifyPassword: comparePassword 
};
