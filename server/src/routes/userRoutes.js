const express = require("express");

const requireAdmin = require("../middleware/requireAdmin");

const {
  getUsers,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const router = express.Router();

// All routes in this file require administrator access.
router.use(requireAdmin);

router.get("/", getUsers);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
