const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    // ADMIN role overrides single role checks for management
    if (req.user.role === 'ADMIN' || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `User role '${req.user.role}' is not authorized to access this route`,
    });
  };
};

module.exports = { authorize };
