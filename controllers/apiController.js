const { v4: uuidv4 } = require("uuid");

const User = require("../models/userModel");
const Expense = require("../models/expensesModel");

const Logger = require("../services/logger");
const {
    updateUserDataValidation,
    addExpenseValidation,
} = require("../services/reqBodyValidations");

const fetchUserDetails = async (req, res) => {
    const uuid = uuidv4();
    Logger.log("info", {
        uuid: uuid,
        user: req.user._id,
        function_name: "fetchUserDetails",
        message: "Entered fetchUserDetails Function",
    });
    try {
        if (req.user !== undefined) {
            Logger.log("info", {
                code: "OK",
                message: "User-data fetchd successfully",
                uuid: uuid,
                user: req.user._id,
                function_name: "fetchUserDetails",
            });
            return res.status(200).json({
                code: "OK",
                message: "User-data fetchd successfully",
                userData: req.user,
            });
        }
    } catch (error) {
        console.log(error);
        Logger.log("error", {
            code: error.name,
            message: "Error while Logging in",
            reason: error.message,
            uuid: uuid,
            user: req.user._id,
        });
        return res.status(500).json({
            message: "Fetching user data failed",
            reason: error.message,
            code: error.name,
        });
    } finally {
        Logger.log("info", {
            uuid: uuid,
            user: req.user._id,
            function_name: "fetchUserDetails",
            message: "Exited fetchUserDetails Function",
        });
    }
};
const updateUserDetails = async (req, res) => {
    const uuid = uuidv4();
    Logger.log("info", {
        uuid: uuid,
        user: req.user._id,
        function_name: "updateUserDetails",
        message: "Entered updateUserDetails Function",
    });

    try {
        const { error, value } = updateUserDataValidation.validate(req.body);
        const { _id } = req.user;
        if (error) {
            Logger.log("error", {
                code: "BAD_REQUEST",
                message: "API validation failed",
                function_name: "signupUser",
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
        const result = await User.updateOne(
            { _id: _id },
            { $set: value },
            { new: true }
        );
        if (result.modifiedCount > 0) {
            return res.status(201).json({
                code: "UPDATED",
                message: "User data updated successfully",
            });
        } else {
            return res.status(200).json({
                code: "OK",
                message: "User data upto date",
            });
        }
    } catch (error) {
        console.log(error);
        Logger.log("error", {
            code: error.name,
            message: "Error while updating user details",
            reason: error.message,
            uuid: uuid,
            user: req.user._id,
        });
        return res.status(500).json({
            message: "Updating user data failed",
            reason: error.message,
            code: error.name,
        });
    } finally {
        Logger.log("info", {
            uuid: uuid,
            user: req.user._id,
            function_name: "updateUserDetails",
            message: "Exited updateUserDetails Function",
        });
    }
};
const addExpense = async (req, res) => {
    const uuid = uuidv4();
    Logger.log("info", {
        uuid: uuid,
        user: req.user._id,
        function_name: "addExpense",
        message: "Entered addExpense Function",
    });
    try {
        const { error, value } = addExpenseValidation.validate(req.body);
        const { _id } = req.user;
        if (error) {
            Logger.log("error", {
                code: "BAD_REQUEST",
                message: "API validation failed",
                function_name: "addExpense",
                reason: "Missing Inputs",
                uuid: uuid,
                details: error.message,
            });
            return res.status(400).json({
                error: "BAD_REQUEST",
                message: "Missing Required Parameters",
                details: error.message,
            });
        }
        const { item, location, date, paymentType, amount, category } = value;
        const newExpense = await Expense.create({
            user: _id,
            item: item,
            location: location,
            date: new Date(date),
            paymentType: paymentType,
            amount: amount,
            category: category,
        });
        const allowedProperties = [
            "item",
            "location",
            "date",
            "amount",
            "category",
            "_id",
            "paymentType",
        ];

        const responseData = {};
        allowedProperties.forEach((property) => {
            if (property === "date") {
                responseData[property] =
                    newExpense[property].toLocaleDateString("en-GB");
            } else {
                responseData[property] = newExpense[property];
            }
        });
        Logger.log("info", {
            code: "CREATED",
            message: "Expense added successfully",
            uuid: uuid,
            user: req.user._id,
            function_name: "addExpense",
        });
        return res.status(201).json({
            code: "CREATED",
            message: "Expense added successfully",
            expenseData: responseData,
        });
    } catch (error) {
        console.log(error);
        Logger.log("error", {
            code: error.name,
            message: "Error while adding expense ",
            reason: error.message,
            uuid: uuid,
            user: req.user._id,
        });
        return res.status(500).json({
            message: "Adding expense failed",
            reason: error.message,
            code: error.name,
        });
    } finally {
        Logger.log("info", {
            uuid: uuid,
            user: req.user._id,
            function_name: "addExpense",
            message: "Exited addExpense Function",
        });
    }
};
const getExpenses = async (req, res) => {
    try {
        const { user } = req;
        const allExpenses = await Expense.find({ user: user._id }).sort({
            createdAt: -1,
        });

        const allowedProperties = [
            "item",
            "location",
            "date",
            "amount",
            "category",
            "_id",
            "paymentType",
        ];

        const organizedExpenses = allExpenses.reduce((acc, expense) => {
            const category = expense.category || "Uncategorized";
            acc[category] = acc[category] || [];
            console.log(expense.date);
            if (acc[category].length < 2) {
                const filteredExpense = allowedProperties.reduce(
                    (filtered, property) => {
                        filtered[property] = expense[property];
                        return filtered;
                    },
                    {}
                );

                acc[category].push({
                    ...filteredExpense,
                    date: expense.date.toLocaleDateString("en-GB"),
                });
            }

            return acc;
        }, {});

        const topFiveExpenses = allExpenses.slice(0, 5).map((expense) => {
            const filteredExpense = allowedProperties.reduce(
                (filtered, property) => {
                    filtered[property] = expense[property];
                    return filtered;
                },
                {}
            );

            return {
                ...filteredExpense,
                date: expense.date.toLocaleDateString("en-GB"),
            };
        });

        const filteredAllExpenses = allExpenses.map((expense) => {
            const filteredExpense = allowedProperties.reduce(
                (filtered, property) => {
                    filtered[property] = expense[property];
                    return filtered;
                },
                {}
            );

            return {
                ...filteredExpense,
                date: expense.date.toLocaleDateString("en-GB"),
            };
        });

        const userExpenseData = {
            topFiveExpenses: topFiveExpenses,
            organizedExpenses: organizedExpenses,
            allExpenses: filteredAllExpenses,
        };

        return res.status(200).json({
            success: true,
            expenseData: userExpenseData,
        });
    } catch (error) {
        console.log(error);
    }
};
const getExpense = async (req, res) => {
    const { id } = req.params;
    const expense = await Expense.findById(id);
    console.log(expense);
    return res.status(200).json({ sucess: true, expenseData: expense });
};
const updateExpense = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);
    const updatedExpense = await Expense.findByIdAndUpdate(id, req.body, {
        new: true,
    });
    if (!updatedExpense) {
        console.log("Document not found");
        return res.status(404).json({ success: false });
    }
    const allowedProperties = [
        "item",
        "location",
        "date",
        "amount",
        "category",
        "_id",
        "paymentType",
    ];
    console.log(updatedExpense);
    const responseData = {};
    allowedProperties.forEach((property) => {
        if (property === "date") {
            responseData[property] =
                updatedExpense[property].toLocaleDateString("en-GB");
        } else {
            responseData[property] = updatedExpense[property];
        }
    });

    return res
        .status(200)
        .json({ success: true, updatedExpense: updatedExpense });
};
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("insedie");
        const deletedExpense = await Expense.findByIdAndDelete(id);

        // Check if document was found and deleted
        if (!deletedExpense) {
            return res
                .status(404)
                .json({ success: false, message: "Expense not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Expense deleted successfully",
            deletedExpense,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = {
    fetchUserDetails,
    updateUserDetails,
    addExpense,
    getExpenses,
    getExpense,
    updateExpense,
    deleteExpense,
};
