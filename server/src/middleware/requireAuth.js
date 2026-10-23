function requireAuth(req, res, next) {
  // Is there a logged-in user in the session?
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }

  // Allow the request to continue.
  next();
}

module.exports = requireAuth;
