const express = require("express");
const router = express.Router();

const {
    createTransaction,
    getTransactions,
    getDashboard,
    deleteTransaction,
    updateTransaction
} = require("../controllers/transactionController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");


// Admin only → Full control
router.post("/", protect, authorize("admin"), createTransaction);
router.put("/:id", protect, authorize("admin"), updateTransaction);
router.delete("/:id", protect, authorize("admin"), deleteTransaction);


// Analyst + Admin → View transactions
router.get("/", protect, authorize("admin", "analyst", "viewer"), getTransactions);


// All roles → Dashboard access
router.get(
    "/dashboard",
    protect,
    authorize("admin", "analyst", "viewer"),
    getDashboard
);


module.exports = router;