const bcrypt = require("bcryptjs");

/**
 * Hash a plain password securely
 * @param {string} password - Plain text password
 * @param {number} saltRounds - Cost factor (default 10)
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password, saltRounds = 10) => {
  if (!password) throw new Error("Password is required");
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
};

module.exports = { hashPassword };
