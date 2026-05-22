const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'electron-labyrinthe-secret-key-change-in-production';

/**
 * Authentication Manager
 * Handles user registration, login, and token verification
 */
class Auth {
  constructor(database) {
    this.db = database;
  }

  /**
   * Register a new user
   * @param {string} username - Username
   * @param {string} email - Email
   * @param {string} password - Plain text password
   * @returns {object} Result with user or error
   */
  async register(username, email, password) {
    try {
      // Validation
      if (!username || username.length < 3) {
        return { success: false, message: 'Le nom d\'utilisateur doit avoir au moins 3 caractères' };
      }
      if (!email || !this.isValidEmail(email)) {
        return { success: false, message: 'Email invalide' };
      }
      if (!password || password.length < 6) {
        return { success: false, message: 'Le mot de passe doit avoir au moins 6 caractères' };
      }

      // Check if user already exists
      const existingUser = await this.db.getUserByUsername(username);
      if (existingUser) {
        return { success: false, message: 'Ce nom d\'utilisateur est déjà pris' };
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 10);

      // Create user
      const userId = await this.db.createUser(username, hashedPassword, 0);

      // Generate token
      const token = this.generateToken(userId, username);

      return {
        success: true,
        user: {
          id: userId,
          username,
          email,
          role: 'user'
        },
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Login user
   * @param {string} username - Username
   * @param {string} password - Plain text password
   * @returns {object} Result with user and token or error
   */
  async login(username, password) {
    try {
      // Validation
      if (!username || !password) {
        return { success: false, message: 'Nom d\'utilisateur et mot de passe requis' };
      }

      // Get user
      const user = await this.db.getUserByUsername(username);
      if (!user) {
        return { success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' };
      }

      // Compare passwords
      const passwordMatch = await bcryptjs.compare(password, user.password);
      if (!passwordMatch) {
        return { success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' };
      }

      // Generate token
      const token = this.generateToken(user.id, user.username, user.is_admin);

      // Get safe user data (without password)
      const safeUser = await this.db.getUserById(user.id);

      return {
        success: true,
        user: {
          ...safeUser,
          role: safeUser.is_admin ? 'admin' : 'user'
        },
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {object} Decoded token or null
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Generate JWT token
   * @param {number} userId - User ID
   * @param {string} username - Username
   * @param {number} isAdmin - Admin flag
   * @returns {string} JWT token
   */
  generateToken(userId, username, isAdmin = 0) {
    const token = jwt.sign(
      {
        id: userId,
        username,
        role: isAdmin ? 'admin' : 'user'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return token;
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {object} Validation result
   */
  validatePasswordStrength(password) {
    const requirements = {
      length: password.length >= 6,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;

    return {
      score,
      requirements,
      strength: score <= 2 ? 'faible' : score <= 3 ? 'moyen' : 'fort'
    };
  }
}

module.exports = Auth;
