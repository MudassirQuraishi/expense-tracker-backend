const User = require("../models/userModel");
const { v4: uuidv4 } = require("uuid");
const { createTransport } = require("nodemailer");

const { generateDynamicHTML, generatePasswordResetHTML } = require("./html");

const updateFirstLoginAsync = async (userId) => {
    try {
        const user = await User.findByIdAndUpdate(userId, {
            $set: { firstLogin: false },
        });
    } catch (error) {
        console.error(`Error updating user ${userId}: ${error.message}`);
    }
};

const sendVerificationEmail = async (email) => {
    const uuid = uuidv4();
    try {
        const transporter = createTransport({
            host: "smtp-relay.sendinblue.com",
            port: 587,
            auth: {
                user: "mudassir.quraishi14@outlook.com",
                pass: "xsmtpsib-571ac74ce12fe241c9aec5c99a128b846d5929a6493eef2e27ed43aa3864c15e-D4wgWp8avxNLVnSt",
            },
        });

        const mailOptions = {
            from: "mudassir.quraishi14@outlook.com",
            to: email,
            subject: `Your subject`,
            html: generateDynamicHTML(uuid),
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent: " + info.response);
        return uuid;
    } catch (error) {
        console.error("Error sending email:", error);
    }
};
const sendPasswordResetEmail = async (email) => {
    const uuid = uuidv4();
    try {
        const transporter = createTransport({
            host: "smtp-relay.sendinblue.com",
            port: 587,
            auth: {
                user: "mudassir.quraishi14@outlook.com",
                pass: "xsmtpsib-571ac74ce12fe241c9aec5c99a128b846d5929a6493eef2e27ed43aa3864c15e-D4wgWp8avxNLVnSt",
            },
        });

        const mailOptions = {
            from: "mudassir.quraishi14@outlook.com",
            to: email,
            subject: `Your subject`,
            html: generatePasswordResetHTML(uuid),
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent: " + info.response);
        return uuid;
    } catch (error) {
        console.error("Error sending email:", error);
    }
};
module.exports = {
    updateFirstLoginAsync,
    sendVerificationEmail,
    sendPasswordResetEmail,
};
