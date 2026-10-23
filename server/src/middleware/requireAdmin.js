const pool = require("../config/db");

async function requireAdmin(req, res, next) {
  try {
    const sessionUser = req.session?.user;

    if (!sessionUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const [rows] = await pool.execute(
      "SELECT id, user_name, email, role FROM users WHERE id = ? LIMIT 1",
      [sessionUser.id],
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Your account no longer exists. Please log in again.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Administrator permission required.",
      });
    }

    // Refresh the session's user information from the database.
    req.session.user = {
      id: user.id,
      userName: user.user_name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = requireAdmin;
