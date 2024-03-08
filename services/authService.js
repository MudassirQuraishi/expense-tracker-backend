const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const { v4: uuidv4 } = require("uuid");
const secretKey = process.env.SECRET_KEY;
const Logger = require("./logger.js");
exports.signToken = async (userId, keepLoggedIn) => {
    const uuid = uuidv4();
    try {
        const payload = {
            id: userId,
        };
        if (!keepLoggedIn) {
            const token = jwt.sign(payload, secretKey, { expiresIn: 3600 });
            return token;
        }
        const token = jwt.sign(payload, secretKey);
        return token;
    } catch (error) {
        console.log(error);
        Logger.log("error", {
            code: "UNKNOWN_ERROR",
            message: "token generation failed",
            step: "signToken",
            details: "Error generating token",
            uuid: uuid,
            user: userId,
        });
        return null;
    }
};
exports.authenticateUser = async (req, res, next) => {
    const uuid = uuidv4();
    Logger.log("info", {
        uuid: uuid,
        step: "checkLogin",
        message: "Entered Function",
    });
    try {
        const token = req.headers.authorization || req.params.token;
        const decodedToken = jwt.verify(token, secretKey);
        const user = await User.findOne({ email: decodedToken.id });
        if (!user) {
            Logger.log("error", {
                code: "USER_NOT_FOUND",
                message: "User not found",
                step: "authenticateUser",
                reason: "No user found in the database",
                uuid: uuid,
            });
            return res
                .status(404)
                .json({ error: "Not Found", message: "User data not found" });
        }
        req.user = user;
        return next();
    } catch (error) {
        console.log(error);
        if (error.name === "TokenExpiredError") {
            Logger.log("error", {
                code: "TOKEN_EXPIRED",
                message: "The provided token has expired",
                step: "authenticateUser",
                uuid: uuid,
            });
            return res.status(401).json({
                error: "TOKEN_EXPIRED",
                message: "The provided token has expired",
            });
        }
        if (error.name === "JsonWebTokenError") {
            Logger.log("error", {
                code: "INVALID_TOKEN",
                message: "The provided token is INVALID",
                step: "authenticateUser",
                uuid: uuid,
            });
            return res.status(401).json({
                error: "INVALID_TOKEN",
                message: "The provided token is INVALID",
            });
        }
        const stackTraceLines = error.stack.split("\n");
        const relevantStackTrace =
            stackTraceLines.length > 1
                ? stackTraceLines[1].trim()
                : "Unknown step";
        Logger.log("error", {
            code: error.name,
            message: "error while authenticating user token",
            reason: error.message,
            step: relevantStackTrace,
            uuid: uuid,
        });
        return res.status(500).json({
            error: error.name,
            message: "Error Authenticating User",
        });
    } finally {
        Logger.log("info", {
            uuid: uuid,
            step: "authenticateUser",
            message: "Exited Function",
        });
    }
};
