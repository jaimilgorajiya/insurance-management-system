/**
 * Validate password strength based on rules
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, isValid: boolean, errors: string[]}}
 */
const validatePassword = (password) => {
  const rules = {
    minLength: 8,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
  };

  const errors = [];
  
  if (!password) {
      errors.push("Password is required");
      return { valid: false, isValid: false, errors };
  }

  if (password.length < rules.minLength)
    errors.push("Password must be at least 8 characters");
  if (!rules.hasUppercase.test(password))
    errors.push("Password must contain an uppercase letter");
  if (!rules.hasLowercase.test(password))
    errors.push("Password must contain a lowercase letter");
  if (!rules.hasNumber.test(password))
    errors.push("Password must contain a number");
  if (!rules.hasSpecialChar.test(password))
    errors.push("Password must contain a special character");

  const isValid = errors.length === 0;

  return {
    valid: isValid, // Backward compatibility
    isValid,        // New standard property
    errors,
  };
};

module.exports = { validatePassword };
