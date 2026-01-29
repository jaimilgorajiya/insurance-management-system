import { User } from "../models/user.models.js";
import { validatePassword, hashPassword } from "@jaimilgorajiya/password-utils";
import { sendCredentialsEmail } from "./emailService.js";
import { sendWelcomeSMS } from "./smsService.js";

/**
 * Generate a strong temporary password
 * @param {number} length - Password length (default: 12)
 * @returns {string} Generated password
 */
const generateTempPassword = (length = 12) => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = "";
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Create a new user with role-based validation
 * @param {Object} userData - User data
 * @param {Object} createdBy - User who is creating this user
 * @returns {Object} Created user and temporary password
 */
export const createUser = async (userData, createdBy = null) => {
    try {
        const { name, email, mobile, role } = userData;

        // Validate required fields
        if (!email || !role) {
            throw new Error("Email and role are required");
        }

        // Validate role
        if (!["admin", "agent", "customer"].includes(role)) {
            throw new Error("Invalid role specified");
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        // Generate temporary password
        const tempPassword = generateTempPassword();

        // Validate the generated password
        const passwordValidation = validatePassword(tempPassword);
        if (!passwordValidation.isValid) {
            throw new Error("Generated password validation failed");
        }

        // Hash the password
        const hashedPassword = await hashPassword(tempPassword);

        // Prepare user data
        const newUserData = {
            name: name?.trim() || "",
            email: email.toLowerCase().trim(),
            mobile: mobile?.trim() || "",
            password: hashedPassword,
            role,
            status: "active",
            createdAt: new Date()
        };

        // Add createdBy if provided
        if (createdBy) {
            newUserData.createdBy = createdBy._id;
        }

        // Create user
        const newUser = await User.create(newUserData);
        const createdUser = await User.findById(newUser._id).select("-password");

        // Send credentials email
        try {
            await sendCredentialsEmail({
                email: createdUser.email,
                name: createdUser.name,
                role: createdUser.role,
                tempPassword,
                loginUrl: getLoginUrl(createdUser.role)
            });
        } catch (emailError) {
            console.error("❌ Email sending failed:", emailError.message);
            // Don't throw error here - user is created successfully, email is secondary
        }

        // Send Welcome SMS
        try {
            if (newUserData.mobile) {
                await sendWelcomeSMS({
                    mobile: newUserData.mobile,
                    name: createdUser.name,
                    role: createdUser.role,
                    email: createdUser.email,
                    password: tempPassword
                });
            }
        } catch (smsError) {
            console.error("❌ SMS sending failed:", smsError.message);
        }

        return {
            user: createdUser,
            tempPassword // Only for response, not stored
        };

    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * Get login URL based on user role
 * @param {string} role - User role
 * @returns {string} Login URL
 */
const getLoginUrl = (role) => {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return `${baseUrl}/${role}/login`;
};

/**
 * Validate user creation permissions
 * @param {Object} creator - User creating the new user
 * @param {string} targetRole - Role of user being created
 * @returns {boolean} Whether creation is allowed
 */
export const canCreateUser = (creator, targetRole) => {
    if (!creator || !targetRole) return false;

    const permissions = {
        admin: ["admin", "agent", "customer"],
        agent: ["customer"],
        customer: []
    };

    return permissions[creator.role]?.includes(targetRole) || false;
};