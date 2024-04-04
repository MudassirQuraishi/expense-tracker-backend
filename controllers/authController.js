const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const User = require("../models/userModel");
const passwordChangeRequest = require("../models/passwordChangeRequestsModel");
const Logger = require("../services/logger");
const {
    logInfo,
    logError,
    sendResponse,
} = require("../services/hanlderFunctions");
const { signToken } = require("../services/authService");

const {
    signupValidation,
    loginValidation,
    resetPasswordValidation,
    updatePasswordValidation,
} = require("../services/reqBodyValidations");

const {
    updateFirstLoginAsync,
    sendVerificationEmail,
    sendPasswordResetEmail,
} = require("../services/customFunctions");

const {
    successfullVerificationHTML,
    errorVerificationHTML,
} = require("../services/html");

/**
 * Registers a new user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - Returns a JSON response indicating successful user creation or an error message.
 */
const signupUser = async (req, res) => {
    const uuid = uuidv4();
    logInfo("signupUser", "Entered function", req, uuid);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { error, value } = signupValidation.validate(req.body);
        if (error) {
            logError(
                "signupUser",
                error,
                "BAD_REQUEST",
                "API validation failed",
                req,
                uuid
            );

            return res.status(400).json({
                error: "BAD_REQUEST",
                message: "Missing Credentials",
                details: error.message,
            });
        }
        const { email, password } = value;
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            Logger.log("error", {
                code: "CONFLICT",
                message: "Existing user",
                function_name: "signupUser",
                reason: "User already exists",
                uuid: uuid,
                user: existingUser._id,
            });
            return res.status(409).json({
                error: "CONFLICT",
                message: `User already exists`,
            });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = new User({
            email: email,
            password: hashedPassword,
        });
        await user.save({ session });
        const verificationToken = await sendVerificationEmail(email);
        if (verificationToken) {
            user.emailVerificationToken = verificationToken;
            await user.save({ session });
            await session.commitTransaction();
            Logger.log("info", {
                code: "CREATED",
                message: "User created successfully",
                uuid: uuid,
                user: user._id,
                function_name: "signupUser",
            });
            return res.status(201).json({
                code: "CREATED",
                message: "User created successfully",
            });
        } else {
            Logger.log("error", {
                code: "SOME_ERROR",
                message: "Error Sending Verification Email",
                uuid: uuid,
                user: user._id,
                function_name: "signupUser",
            });
            throw new Error("Error Sending Verification Email");
        }
    } catch (error) {
        await session.abortTransaction();

        Logger.log("error", {
            code: error.name,
            message: "Error while signing up user",
            reason: error.message,
            stack: error.stack,
            uuid: uuid,
            user: req.body.email,
        });

        return res.status(500).json({
            message: "User creation failed",
            reason: error.message,
            code: error.name,
        });
    } finally {
        session.endSession();

        Logger.log("info", {
            uuid: uuid,
            user: req.body.email,
            function_name: "signupUser",
            message: "Exited signupUser Function",
        });
    }
};

/**
 * Logs in a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - Returns a JSON response indicating successful user login or an error message.
 */
const loginUser = async (req, res) => {
    const uuid = uuidv4();
    Logger.log("info", {
        uuid: uuid,
        user: req.body.email,
        function_name: "loginUser",
        message: "Entered loginUser Function",
    });

    try {
        const { error, value } = loginValidation.validate(req.body);
        if (error) {
            Logger.log("error", {
                code: "BAD_REQUEST",
                message: "API validation failed",
                function_name: "loginUser",
                reason: "Missing Inputs",
                uuid: uuid,
                details: error.message,
            });
            return res.status(400).json({
                error: "BAD_REQUEST",
                message: "Missing Credentials",
                details: error.message,
            });
        }
        const { email, password, keepLoggedIn } = value;
        const user = await User.findOne({ email: email });
        if (!user) {
            Logger.log("error", {
                code: "NOT_FOUND",
                message: "User not found",
                function_name: "loginUser",
                reason: "No user data found in the database",
                uuid: uuid,
                user: email,
            });
            return res.status(404).json({
                code: "NOT_FOUND",
                success: false,
                message: "User Not Found",
            });
        }
        if (!user.isEmailVerified) {
            Logger.log("error", {
                code: "EMAIL_NOT_VERIFIED",
                message: "Email not verified",
                function_name: "loginUser",
                reason: "Email verification is required to access this resource.",
                uuid: uuid,
                user: email,
            });
            return res.status(403).json({
                code: "EMAIL_NOT_VERIFIED",
                success: false,
                message: "Please verify your email before proceeding.",
            });
        }
        const passwordCheck = await bcrypt.compare(password, user.password);
        if (!passwordCheck) {
            Logger.log("error", {
                code: "BAD_REQUEST",
                message: "Invalid password",
                function_name: "loginUser",
                uuid: uuid,
                user: user._id,
            });
            return res.status(400).json({
                code: "BAD_REQUEST",
                message: "Password Mismatch",
                success: false,
            });
        }
        if (user.firstLogin) {
            updateFirstLoginAsync(user._id);
        }
        if (keepLoggedIn) {
            user.keepLoggedIn = true;
            await user.save();
        }
        const jwtToken = await signToken(email, user.keepLoggedIn);
        Logger.log("info", {
            code: "OK",
            message: "User logged in successfully",
            uuid: uuid,
            user: user._id,
        });
        return res.status(200).json({
            code: "OK",
            message: "Logged in successfully",
            success: true,
            encryptedId: jwtToken,
            user: user,
        });
    } catch (error) {
        console.log(error);
        Logger.log("error", {
            code: error.name,
            message: "Error while Logging in",
            reason: error.message,
            uuid: uuid,
            user: req.body.email,
        });
        return res.status(500).json({
            message: "User log in failed",
            reason: error.message,
            code: error.name,
        });
    } finally {
        Logger.log("info", {
            uuid: uuid,
            user: req.body.email,
            function_name: "loginUser",
            message: "Exited loginUser Function",
        });
    }
};
/**
 * Logs in a user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - Returns a JSON response indicating successful user login or an error message.
 */
const updatePassword = async (req, res) => {
    const uuid = uuidv4();
    const session = await mongoose.startSession();
    session.startTransaction();
    Logger.log("info", {
        uuid: uuid,
        function_name: "resetPassword",
        message: "Entered Function",
    });
    try {
        const { error, value } = updatePasswordValidation.validate(req.body);
        if (error) {
            Logger.log("error", {
                code: "BAD_REQUEST",
                message: "API validation failed",
                function_name: "resetPassword",
                reason: "Missing Inputs",
                uuid: uuid,
                details: error.message,
            });
            return res.status(400).json({
                error: "BAD_REQUEST",
                message: "Missing Credentials",
                details: error.message,
            });
        }
        const { newPassword } = value;
        const { uniqueId } = req.params;
        console.log(uniqueId);
        const requestId = await passwordChangeRequest.findOne({
            uniqueId: uniqueId,
        });
        console.log(requestId);
        if (!requestId.isActive) {
            Logger.log("error", {
                code: "NOT_FOUND",
                message: "User not found",
                function_name: "resetPassword",
                reason: "No user data found in the database",
                uuid: uuid,
            });
            return res.status(404).json({
                code: "NOT_FOUND",
                success: false,
                message: "User Not Found",
            });
        }
        // const user = await User.findOne({ _id: requestId.user });
        const user = await User.findById(requestId.user);
        console.log(user);
        if (!user) {
            Logger.log("error", {
                code: "NOT_FOUND",
                message: "User not found",
                function_name: "resetPassword",
                reason: "No user data found in the database",
                uuid: uuid,
            });
            return res.status(404).json({
                code: "NOT_FOUND",
                success: false,
                message: "User Not Found",
            });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        await user.save({ session });
        requestId.isActive = false;
        await requestId.save({ session });
        await session.commitTransaction();
        Logger.log("info", {
            code: "OK",
            message: "Password Changed Successfully",
            uuid: uuid,
            user: user._id,
        });
        return res.status(200).json({
            code: "OK",
            message: "Password changed successfully",
            success: true,
        });
    } catch (error) {
        await session.abortTransaction();
        console.log(error);
        Logger.log("error", {
            code: error.name,
            message: "Error updating password",
            reason: error.message,
            uuid: uuid,
        });
        return res.status(500).json({
            message: "Password Update Failed",
            reason: error.message,
            code: error.name,
        });
    } finally {
        session.endSession();
        Logger.log("info", {
            uuid: uuid,
            function_name: "resetPassword",
            message: "Exited Function",
        });
    }
};
const verifyUserEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ emailVerificationToken: token });
        if (!user.isEmailVerified) {
            user.isEmailVerified = true;
            delete user.emailVerificationToken;
            await user.save();
            return res.status(200).send(successfullVerificationHTML);
        } else {
            throw new Error("EMAIL_VERIFIED");
        }
    } catch (error) {
        return res.status(500).send(errorVerificationHTML);
    }
};
const resetPassword = async (req, res) => {
    const uuid = uuidv4();
    Logger.log("info", {
        uuid: uuid,
        user: req.body.email,
        function_name: "resetPassword",
        message: "Entered resetPassword Function",
    });
    try {
        const { error, value } = resetPasswordValidation.validate(req.body);
        if (error) {
            Logger.log("error", {
                code: "BAD_REQUEST",
                message: "API validation failed",
                function_name: "resetPassword",
                reason: "Missing Inputs",
                uuid: uuid,
                details: error.message,
            });
            return res.status(400).json({
                error: "BAD_REQUEST",
                message: "Missing Credentials",
                details: error.message,
            });
        }
        const { email } = value;
        const user = await User.findOne({ email: email });
        if (!user) {
            Logger.log("error", {
                code: "NOT_FOUND",
                message: "User not found",
                function_name: "resetPassword",
                reason: "No user data found in the database",
                uuid: uuid,
                user: email,
            });
            return res.status(404).json({
                code: "NOT_FOUND",
                success: false,
                message: "User Not Found",
            });
        }

        const verificationToken = await sendPasswordResetEmail(user.email);
        if (verificationToken) {
            await passwordChangeRequest.create({
                user: user._id,
                uniqueId: verificationToken,
                isActive: true,
            });
            Logger.log("info", {
                code: "CREATED",
                message: "Email sent successfully",
                uuid: uuid,
                user: user._id,
                function_name: "resetPassword",
            });
            return res.status(201).json({
                code: "CREATED",
                message: "Email sent successfully",
            });
        } else {
            Logger.log("error", {
                code: "SOME_ERROR",
                message: "Error Sending password reset Email",
                uuid: uuid,
                user: user._id,
                function_name: "resetPassword",
            });
            throw new Error("Error Sending password reset Email");
        }
    } catch (error) {
        console.log(error);
    } finally {
    }
};

module.exports = {
    signupUser,
    loginUser,
    updatePassword,
    verifyUserEmail,
    resetPassword,
};
