const Joi = require("joi");
/**
 * Joi schema for validating signup credentials.
 */
const signupValidation = Joi.object({
    email: Joi.string()
        .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        .required(),
    password: Joi.string()
        .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required(),
});

/**
 * Joi schema for validating login credentials.
 */
const loginValidation = Joi.object({
    email: Joi.string()
        .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        .required(),
    password: Joi.string()
        .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required(),
    keepLoggedIn: Joi.boolean(),
});
const updateUserDataValidation = Joi.object({
    email: Joi.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    fullname: Joi.string(),
    username: Joi.string(),
    phoneNumber: Joi.string(),
    profilePhoto: Joi.string(),
});

/**
 * Joi schema for validating update password body.
 */
const updatePasswordValidation = Joi.object({
    newPassword: Joi.string().min(8).required(),
});
/**
 * Joi schema for validating reset password body.
 */
const resetPasswordValidation = Joi.object({
    email: Joi.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
});

const addExpenseValidation = Joi.object({
    item: Joi.string().required(),
    location: Joi.string().default("Not Specified"),
    date: Joi.date().default("Not Specified"),
    paymentType: Joi.string()
        .valid("credit", "debit", "cash", "emi", "other")
        .default("cash"),
    category: Joi.string()
        .valid(
            "housing & bills",
            "food",
            "transportation",
            "entertainment",
            "shopping",
            "others"
        )
        .default("others"),
    amount: Joi.number().required(),
});
module.exports = {
    signupValidation,
    loginValidation,
    resetPasswordValidation,
    addExpenseValidation,
    updateUserDataValidation,
    updatePasswordValidation,
};
