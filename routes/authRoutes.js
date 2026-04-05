const { authorize } = require("../middleware/roleMiddleware");
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Route for user registration
// POST /api/auth/register
router.post('/register', registerUser);

// Route for user login
// POST /api/auth/login
router.post('/login', loginUser);
const { protect } = require("../middleware/authMiddleware");

router.get("/profile", protect, authorize("admin"), (req, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user
    });
});

module.exports = router;
