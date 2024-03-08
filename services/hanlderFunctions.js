const Logger = require("./logger");
const logError = (
    function_name,
    error,
    errorCode,
    message,
    reason,
    request,
    uniqueIdentifier,
    details
) => {
    Logger.log("error", {
        code: errorCode || error.name || "Un-named error.",
        message: message || "No message provided.",
        reason: reason || error.message || "No reason provided",
        stack: error.stack || null,
        uuid: uniqueIdentifier || " UUID not provided",
        user: request.body.email || "User data not provided",
        function_name: function_name || "Function name not provied",
        details: error.message || details || null,
    });
};
const logInfo = (function_name, message, request, uniqueIdentifier, code) => {
    Logger.log("info", {
        code: code || "Code not provided",
        message: message || " Message not provided",
        uuid: uniqueIdentifier || " UUID not provided",
        user: request.body.email || "User data not provided",
        function_name: function_name || "Function name not provied",
    });
};
const sendResponse = (response, statusCode, message, error, data, code) => {
    response.status(statusCode).json({
        code: code || null,
        message: message || null,
        error: error || null,
        data: data || null,
    });
};

module.exports = {
    logError,
    sendResponse,
    logInfo,
};
