import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { token, expiresIn }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Validate username
    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    if (username !== expectedUsername) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Validate password against bcrypt hash
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!passwordHash) {
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Issue JWT
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.json({
      token,
      expiresIn,
      username,
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed. ' + err.message });
  }
});

/**
 * POST /api/auth/verify
 * Verifies a token is still valid (used by frontend on page load)
 */
router.post('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, username: decoded.username });
  } catch {
    res.status(401).json({ valid: false });
  }
});

export default router;
