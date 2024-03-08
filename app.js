const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const Logger = require("./services/logger");
const authRoutes = require("./routes/authRoutes");
const apiRoutes = require("./routes/apiRoutes");
// const adminRoutes = require("./routes/adminRoutes");
const app = express();
app.use(
    cors({
        origin: ["http://localhost:5173"],
    })
);
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);
// app.use("/admin", adminRoutes);

// Connect to MongoDB using Mongoose
mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => {
        const port = process.env.PORT || 3000;
        const databaseStartTime = new Date().toLocaleString();
        Logger.log("info", {
            message: `MongoDB server successfully connected on ${databaseStartTime}`,
        });

        // Start the server on the specified port
        app.listen(port, () => {
            const serverStartTime = new Date().toLocaleString();
            Logger.log("info", {
                message: `Backend server started at port ${port} on ${serverStartTime}`,
            });
        });
    })
    .catch((error) => {
        console.log(error);
        Logger.log("error", {
            code: "MONGOOSERROR",
            message: "Error while connecting to MongoDB server",
            function_name: "mongodb_connect",
            reason: "connection_failure",
            details: JSON.stringify(error.message),
        });
    });
