const express = require("express");
const router = express.Router();

const {
    fetchUserDetails,
    updateUserDetails,
    addExpense,
    getExpenses,
    getExpense,
    updateExpense,
    deleteExpense,
} = require("../controllers/apiController");
const { authenticateUser } = require("../services/authService");

router.get("/userData", authenticateUser, fetchUserDetails);
router.get("/get-expenses", authenticateUser, getExpenses);
router.get("/get-expense/:id", authenticateUser, getExpense);

router.post("/update-profile", authenticateUser, updateUserDetails);
router.post("/add-expense", authenticateUser, addExpense);
router.put("/update-expense/:id", authenticateUser, updateExpense);
router.delete("/delete-expense/:id", authenticateUser, deleteExpense);

module.exports = router;
