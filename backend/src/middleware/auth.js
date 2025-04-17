const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

const staffOnly = async (req, res, next) => {
  try {
    if (!req.user || !['staff', 'admin'].includes(req.user.role)) {
      throw new Error('Not authorized');
  }
  next();
  } catch (error) {
    res.status(403).json({ error: 'Access denied. Staff only.' });
  }
};

const adminOnly = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new Error('Not authorized');
  }
  next();
  } catch (error) {
    res.status(403).json({ error: 'Access denied. Admin only.' });
  }
};

module.exports = {
  auth,
  staffOnly,
  adminOnly
};