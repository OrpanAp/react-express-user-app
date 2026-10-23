const crypto = require("crypto");

function issueCsrfToken(req, res) {
  if (!req.session) {
    return res.status(500).json({
      success: false,
      message: "Session middleware is not configured.",
    });
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }

  res.set("Cache-Control", "no-store");

  return res.json({
    success: true,
    csrfToken: req.session.csrfToken,
  });
}

function csrfProtection(req, res, next) {
  // Only validate requests that can change server state.
  const safeMethods = ["GET", "HEAD", "OPTIONS"];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  const sessionToken = req.session?.csrfToken;
  const requestToken = req.get("X-CSRF-Token");

  if (typeof sessionToken !== "string" || typeof requestToken !== "string") {
    return res.status(403).json({
      success: false,
      message: "CSRF token missing. Refresh your session and try again.",
    });
  }

  const expected = Buffer.from(sessionToken);
  const received = Buffer.from(requestToken);

  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token.",
    });
  }

  next();
}

module.exports = {
  issueCsrfToken,
  csrfProtection,
};
