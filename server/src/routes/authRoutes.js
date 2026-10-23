const express = require("express");
const { rateLimit } = require("express-rate-limit");

const { issueCsrfToken } = require("../middleware/csrfProtection");

const {
  register,
  login,
  me,
  logout,
} = require("../controllers/authController");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.get("/csrf-token", issueCsrfToken);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", me);
router.post("/logout", logout);

module.exports = router;
