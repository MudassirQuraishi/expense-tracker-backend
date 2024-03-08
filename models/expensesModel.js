const mongoose = require("mongoose");
const { Schema } = mongoose;

const expenseSchema = new mongoose.Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        item: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            default: "Not Specified",
        },
        date: {
            type: Date,
            default: "Not Specified",
        },
        paymentType: {
            type: String,
            enum: ["credit", "debit", "cash", "emi", "other"],
            default: "cash",
        },
        category: {
            type: String,
            enum: [
                "housing & bills",
                "food",
                "transportation",
                "entertainment",
                "shopping",
                "others",
            ],
            default: "others",
        },
        amount: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

const expenses = mongoose.model("expenses", expenseSchema);

module.exports = expenses;
