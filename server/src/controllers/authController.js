const bcrypt = require("bcryptjs");
const pool = require("../config/db");

// Register a new user
async function register(req, res) {
  try {
    const { userName, email, password } = req.body || {};

    if (
      typeof userName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const name = userName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters.",
      });
    }

    if (
      normalizedEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users (user_name, email, password_hash)
       VALUES (?, ?, ?)`,
      [name, normalizedEmail, passwordHash],
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: {
        id: result.insertId,
        userName: name,
        email: normalizedEmail,
        role: "user",
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
}

// Log in an existing user
async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [rows] = await pool.execute(
      `SELECT id, user_name, email, password_hash, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail],
    );

    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Regenerate the session to prevent session fixation.
    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regeneration failed:", error.message);

        return res.status(500).json({
          success: false,
          message: "Could not establish a session.",
        });
      }

      req.session.user = {
        id: user.id,
        userName: user.user_name,
        email: user.email,
        role: user.role,
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError.message);

          return res.status(500).json({
            success: false,
            message: "Could not establish a session.",
          });
        }

        return res.json({
          success: true,
          message: "Login successful.",
          user: req.session.user,
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
}

// Get the currently logged-in user
function me(req, res) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "You are not logged in.",
    });
  }

  return res.json({
    success: true,
    user: req.session.user,
  });
}

// Log out the current user
function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("app.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.json({
      success: true,
      message: "Logout successful.",
    });
  });
}

module.exports = {
  register,
  login,
  me,
  logout,
};
