const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'electron-labyrinthe-secret-key-change-in-production';
class Auth {
  constructor(database) {
    this.db = database;
  }
  async register(username, email, password) {
    try {
      
      if (!username || username.length < 3) {
        return { success: false, message: 'Le nom d\'utilisateur doit avoir au moins 3 caractères' };
      }
      if (!email || !this.isValidEmail(email)) {
        return { success: false, message: 'Email invalide' };
      }
      if (!password || password.length < 6) {
        return { success: false, message: 'Le mot de passe doit avoir au moins 6 caractères' };
      } 
      const existingUser = await this.db.getUserByUsername(username);
      if (existingUser) {
        return { success: false, message: 'Ce nom d\'utilisateur est déjà pris' };
      }
      const hashedPassword = await bcryptjs.hash(password, 10);
      const userId = await this.db.createUser(username, hashedPassword, 0);
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
  async login(username, password) {
    try {
      
      if (!username || !password) {
        return { success: false, message: 'Nom d\'utilisateur et mot de passe requis' };
      }

      
      const user = await this.db.getUserByUsername(username);
      if (!user) {
        return { success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' };
      }

      
      const passwordMatch = await bcryptjs.compare(password, user.password);
      if (!passwordMatch) {
        return { success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' };
      }

      const token = this.generateToken(user.id, user.username, user.is_admin);
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

  
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }
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
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
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
