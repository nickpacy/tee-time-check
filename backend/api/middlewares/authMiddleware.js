// api/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

/**
 * Authentication: validates JWT and attaches { userId, admin } to req.user
 * Expects header: "auth-token: <JWT>"
 */
const verifyToken = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) return res.status(401).send("Access Denied");

  try {
    const payload = jwt.verify(token, process.env.JWT_TOKEN);
    req.user = {
      userId: Number(payload.userId),
      admin: !!payload.admin,
    };
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    res.status(403).send("Invalid or Expired Token");
  }
};

/**
 * Authorization: only allow admins
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.admin) return next();
  return res.status(403).json({ error: "Admin access required" });
};

/**
 * Authorization: allow the user themselves OR an admin
 * @param {string} param - name of route param or query param that holds the target userId (default: "userId")
 */
const requireSelfOrAdmin = (param = "userId") => (req, res, next) => {
  const pathUserId = Number(req.params[param] || req.query[param]);
  if (!Number.isFinite(pathUserId)) {
    return res.status(400).json({ error: `Invalid ${param}` });
  }
  if (req.user?.admin || pathUserId === Number(req.user?.userId)) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden" });
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireSelfOrAdmin,
};
