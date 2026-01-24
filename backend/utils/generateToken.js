import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "24h"
        }
    );
};

const generateTokenAndResponse = async (user, res, message) => {
    const accessToken = generateAccessToken(user);
    const loggedInUser = await User.findById(user._id).select("-password");
    
    const options = { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };
    
    // Set cookie and return token for response
    res.cookie("accessToken", accessToken, options);
    
    return { 
        message, 
        user: loggedInUser, 
        accessToken 
    };
};

export { generateAccessToken, generateTokenAndResponse };
