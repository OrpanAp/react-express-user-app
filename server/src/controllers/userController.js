const pool = require("../config/db");

// GET: List all users
async function getUsers(req, res) {
  try {
    const [users] = await pool.execute(
      `SELECT id, user_name, email, role, created_at, updated_at
       FROM users
       ORDER BY id DESC`,
    );

    return res.json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        userName: user.user_name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      })),
    });
  } catch (error) {
    console.error("Get users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve users.",
    });
  }
}

// PUT: Update a user's name and email
async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);
    const { userName, email } = req.body || {};

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (typeof userName !== "string" || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
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

    const [result] = await pool.execute(
      `UPDATE users
       SET user_name = ?, email = ?
       WHERE id = ?`,
      [name, normalizedEmail, id],
    );

    if (result.affectedRows === 0) {
      const [existing] = await pool.execute(
        "SELECT id FROM users WHERE id = ?",
        [id],
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }
    }

    // Keep the current admin session's user details in sync
    // if the administrator updates their own account.
    if (req.session.user.id === id) {
      req.session.user.userName = name;
      req.session.user.email = normalizedEmail;
    }

    return res.json({
      success: true,
      message: "User updated successfully.",
      user: {
        id,
        userName: name,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "That email address is already in use.",
      });
    }

    console.error("Update user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not update user.",
    });
  }
}

// DELETE: Delete a user

async function deleteUser(req, res) {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID.",
    });
  }

  if (Number(req.session.user.id) === id) {
    return res.status(400).json({
      success: false,
      message: "You cannot delete your own account here.",
    });
  }

  let connection;
  let transactionStarted = false;

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    // Lock administrator rows so concurrent deletions cannot
    // independently conclude that another administrator remains.
    const [admins] = await connection.execute(
      "SELECT id FROM users WHERE role = 'admin' FOR UPDATE",
    );

    // Lock and verify the account being deleted.
    const [targetRows] = await connection.execute(
      "SELECT id, role FROM users WHERE id = ? FOR UPDATE",
      [id],
    );

    const targetUser = targetRows[0];

    if (!targetUser) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (targetUser.role === "admin" && admins.length <= 1) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        message: "Cannot delete the last administrator.",
      });
    }

    const [result] = await connection.execute(
      "DELETE FROM users WHERE id = ?",
      [id],
    );

    if (result.affectedRows !== 1) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await connection.commit();
    transactionStarted = false;

    return res.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Delete rollback error:", rollbackError.message);
      }
    }

    console.error("Delete user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not delete user.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
};
