const Transaction = require("../models/Transaction");

// CREATE transaction
const createTransaction = async (req, res) => {
    try {
        const { amount, type, category, note } = req.body;

        if (!amount || !type || !category) {
            return res.status(400).json({
                message: "Amount, type, and category are required"
            });
        }

        if (typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({
                message: "Amount must be a positive number"
            });
        }

        if (!["income", "expense"].includes(type)) {
            return res.status(400).json({
                message: "Type must be 'income' or 'expense'"
            });
        }

        const transaction = await Transaction.create({
            amount,
            type,
            category: category.trim().toLowerCase(), // 🔥 FIXED
            note,
            user: req.user._id
        });

        res.status(201).json({
            message: "Transaction created",
            transaction
        });

    } catch (error) {
        res.status(500).json({
            message: "Error creating transaction",
            error: error.message
        });
    }
};

// DELETE transaction
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        if (transaction.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to delete this transaction"
            });
        }

        await transaction.deleteOne();

        res.json({
            message: "Transaction deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error deleting transaction",
            error: error.message
        });
    }
};

// UPDATE transaction
const updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        if (transaction.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to update this transaction"
            });
        }

        const { amount, type, category, note } = req.body;

        if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
            return res.status(400).json({
                message: "Amount must be a positive number"
            });
        }

        if (type && !["income", "expense"].includes(type)) {
            return res.status(400).json({
                message: "Invalid type"
            });
        }

        // Update fields
        if (amount !== undefined) transaction.amount = amount;
        if (type) transaction.type = type;
        if (category) transaction.category = category.trim().toLowerCase(); // 🔥 FIXED
        if (note !== undefined) transaction.note = note;

        await transaction.save();

        res.json({
            message: "Transaction updated successfully",
            transaction
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating transaction",
            error: error.message
        });
    }
};

// GET all transactions (with filtering)
const getTransactions = async (req, res) => {
    try {
        const { type, category } = req.query;

        let filter = {};

        if (req.user.role === "viewer") {
            filter.user = req.user._id;
        }

        if (type) filter.type = type;
        if (category) filter.category = category.toLowerCase();

        const transactions = await Transaction.find(filter);

        res.json(transactions);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching transactions",
            error: error.message
        });
    }
};

// GET DASHBOARD
const getDashboard = async (req, res) => {
    try {
        let matchStage = {};

        // Viewer can only see own data
        if (req.user.role === "viewer") {
            matchStage.user = req.user._id;
        }

        const results = await Transaction.aggregate([
            { $match: matchStage },

            {
                $group: {
                    _id: null,

                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
                        }
                    },

                    totalExpense: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
                        }
                    },

                    totalTransactions: { $sum: 1 }
                }
            }
        ]);

        // Category Breakdown separately
        const categoryData = await Transaction.aggregate([
            { $match: matchStage },

            {
                $group: {
                    _id: "$category",
                    total: { $sum: "$amount" }
                }
            }
        ]);

        let categoryBreakdown = {};
        categoryData.forEach(item => {
            categoryBreakdown[item._id] = item.total;
        });

        const dashboard = results[0] || {
            totalIncome: 0,
            totalExpense: 0,
            totalTransactions: 0
        };

        res.json({
            totalIncome: dashboard.totalIncome || 0,
            totalExpense: dashboard.totalExpense || 0,
            balance: (dashboard.totalIncome || 0) - (dashboard.totalExpense || 0),
            totalTransactions: dashboard.totalTransactions || 0,
            categoryBreakdown
        });

    } catch (error) {
        res.status(500).json({
            message: "Error fetching dashboard",
            error: error.message
        });
    }
};
module.exports = {
    createTransaction,
    getTransactions,
    getDashboard,
    deleteTransaction,
    updateTransaction
};