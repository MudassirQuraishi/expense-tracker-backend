const mongoose = require("mongoose");
const { Schema } = mongoose;

const passwordChangeRequestSchema = new mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    uniqueId: {
        type: String,
        required: true,
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});

const passwordChangeRequests = mongoose.model(
    "passwordChangeRequests",
    passwordChangeRequestSchema
);

module.exports = passwordChangeRequests;
