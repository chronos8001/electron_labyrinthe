const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Database class - Manages SQLite database operations
 * Handles user management and labyrinth storage
 */
class Database {
  constructor(dbPath = null) {
    // Store database at user's app data folder, or use provided path
    if (!dbPath) {
      try {
        const { app } = require('electron');
        dbPath = path.join(app.getPath('userData'), 'labyrinthe.db');
      } catch (e) {
        // Fallback if Electron is not available (e.g., during testing)
        dbPath = path.join(__dirname, '../test-db/labyrinthe.db');
      }
    }
    this.db = new sqlite3.Database(dbPath);
    console.log(`Database path: ${dbPath}`);
  }

  /**
   * Promise wrapper for db.run (INSERT, UPDATE, DELETE)
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  /**
   * Promise wrapper for db.get (SELECT single row)
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Promise wrapper for db.all (SELECT multiple rows)
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Initialize database tables
   * Creates users and labyrinths tables if they don't exist
   */
  async initialize() {
    try {
      console.log('Initializing database...');

      // Create users table
      await this.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          is_admin INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Users table created');

      // Create labyrinths table
      await this.run(`
        CREATE TABLE IF NOT EXISTS labyrinths (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          size TEXT NOT NULL,
          difficulty INTEGER NOT NULL,
          maze_data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✓ Labyrinths table created');

      // Create default admin user if not exists
      const admin = await this.get('SELECT * FROM users WHERE username = ?', ['admin']);
      if (!admin) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminId = await this.run(
          'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
          ['admin', hashedPassword, 1]
        );
        console.log(`✓ Default admin user created (ID: ${adminId})`);
      } else {
        console.log('✓ Admin user already exists');
      }

      console.log('Database initialization complete!');
      return { success: true };
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // USER OPERATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Create a new user
   * @param {string} username - Username
   * @param {string} hashedPassword - Bcrypt hashed password
   * @param {number} isAdmin - 0 for user, 1 for admin
   */
  async createUser(username, hashedPassword, isAdmin = 0) {
    try {
      const userId = await this.run(
        'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
        [username, hashedPassword, isAdmin]
      );
      console.log(`User created: ${username} (ID: ${userId})`);
      return userId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by username
   * @param {string} username - Username to find
   */
  async getUserByUsername(username) {
    try {
      const user = await this.get('SELECT * FROM users WHERE username = ?', [username]);
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  /**
   * Get user by ID (without password)
   * @param {number} userId - User ID
   */
  async getUserById(userId) {
    try {
      const user = await this.get(
        'SELECT id, username, is_admin, created_at FROM users WHERE id = ?',
        [userId]
      );
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get all users (without passwords)
   */
  async getAllUsers() {
    try {
      const users = await this.all(
        'SELECT id, username, is_admin, created_at FROM users'
      );
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Delete user and all their labyrinths
   * @param {number} userId - User ID to delete
   */
  async deleteUser(userId) {
    try {
      await this.run('DELETE FROM users WHERE id = ?', [userId]);
      console.log(`User deleted (ID: ${userId})`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Update user role
   * @param {number} userId - User ID
   * @param {number} isAdmin - 0 for user, 1 for admin
   */
  async updateUserRole(userId, isAdmin) {
    try {
      await this.run('UPDATE users SET is_admin = ? WHERE id = ?', [isAdmin, userId]);
      console.log(`User role updated (ID: ${userId}, isAdmin: ${isAdmin})`);
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LABYRINTH OPERATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Create a new labyrinth
   * @param {number} userId - User ID (owner)
   * @param {string} name - Labyrinth name
   * @param {string} size - Size (small, medium, large)
   * @param {number} difficulty - Difficulty level (1-10)
   * @param {object} mazeData - Maze data object (will be stored as JSON)
   */
  async createLabyrinth(userId, name, size, difficulty, mazeData) {
    try {
      const labyrinthId = await this.run(
        'INSERT INTO labyrinths (user_id, name, size, difficulty, maze_data) VALUES (?, ?, ?, ?, ?)',
        [userId, name, size, difficulty, JSON.stringify(mazeData)]
      );
      console.log(`Labyrinth created: ${name} (ID: ${labyrinthId}, Owner: ${userId})`);
      return labyrinthId;
    } catch (error) {
      console.error('Error creating labyrinth:', error);
      throw error;
    }
  }

  /**
   * Get all labyrinths for a user
   * @param {number} userId - User ID
   */
  async getUserLabyrinths(userId) {
    try {
      const labyrinths = await this.all(
        `SELECT id, user_id, name, size, difficulty, created_at, updated_at 
         FROM labyrinths 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [userId]
      );
      return labyrinths;
    } catch (error) {
      console.error('Error getting user labyrinths:', error);
      throw error;
    }
  }

  /**
   * Get labyrinth by ID (includes maze data)
   * @param {number} labyrinthId - Labyrinth ID
   */
  async getLabyrinthById(labyrinthId) {
    try {
      const labyrinth = await this.get(
        'SELECT * FROM labyrinths WHERE id = ?',
        [labyrinthId]
      );
      if (labyrinth) {
        labyrinth.maze_data = JSON.parse(labyrinth.maze_data);
      }
      return labyrinth;
    } catch (error) {
      console.error('Error getting labyrinth by ID:', error);
      throw error;
    }
  }

  /**
   * Get all labyrinths (for admin)
   */
  async getAllLabyrinths() {
    try {
      const labyrinths = await this.all(
        `SELECT l.id, l.user_id, l.name, l.size, l.difficulty, u.username, l.created_at 
         FROM labyrinths l 
         JOIN users u ON l.user_id = u.id 
         ORDER BY l.created_at DESC`
      );
      return labyrinths;
    } catch (error) {
      console.error('Error getting all labyrinths:', error);
      throw error;
    }
  }

  /**
   * Update labyrinth
   * @param {number} labyrinthId - Labyrinth ID
   * @param {object} updates - Object with fields to update
   */
  async updateLabyrinth(labyrinthId, updates) {
    try {
      let updateQuery = 'UPDATE labyrinths SET ';
      const params = [];
      const fields = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        params.push(updates.name);
      }
      if (updates.maze_data !== undefined) {
        fields.push('maze_data = ?');
        params.push(JSON.stringify(updates.maze_data));
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      updateQuery += fields.join(', ') + ' WHERE id = ?';
      params.push(labyrinthId);

      await this.run(updateQuery, params);
      console.log(`Labyrinth updated (ID: ${labyrinthId})`);
      return true;
    } catch (error) {
      console.error('Error updating labyrinth:', error);
      throw error;
    }
  }

  /**
   * Delete labyrinth
   * @param {number} labyrinthId - Labyrinth ID
   */
  async deleteLabyrinth(labyrinthId) {
    try {
      await this.run('DELETE FROM labyrinths WHERE id = ?', [labyrinthId]);
      console.log(`Labyrinth deleted (ID: ${labyrinthId})`);
      return true;
    } catch (error) {
      console.error('Error deleting labyrinth:', error);
      throw error;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATISTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get database statistics
   */
  async getStatistics() {
    try {
      const userCount = await this.get('SELECT COUNT(*) as count FROM users');
      const labyrinthCount = await this.get('SELECT COUNT(*) as count FROM labyrinths');
      const userLabyrinthCounts = await this.all(
        `SELECT u.username, COUNT(l.id) as count 
         FROM users u 
         LEFT JOIN labyrinths l ON u.id = l.user_id 
         GROUP BY u.id`
      );

      return {
        totalUsers: userCount.count,
        totalLabyrinths: labyrinthCount.count,
        userLabyrinthCounts
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Get detailed statistics for admin dashboard
   */
  async getDetailedStatistics() {
    try {
      const stats = await this.getStatistics();

      // Get difficulty distribution
      const difficultyDistribution = await this.all(
        'SELECT difficulty, COUNT(*) as count FROM labyrinths GROUP BY difficulty'
      );

      // Get size distribution
      const sizeDistribution = await this.all(
        'SELECT size, COUNT(*) as count FROM labyrinths GROUP BY size'
      );

      return {
        ...stats,
        difficultyDistribution,
        sizeDistribution
      };
    } catch (error) {
      console.error('Error getting detailed statistics:', error);
      throw error;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATABASE MAINTENANCE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }

  /**
   * Get database info
   */
  async getDatabaseInfo() {
    try {
      const userCount = await this.get('SELECT COUNT(*) as count FROM users');
      const labyrinthCount = await this.get('SELECT COUNT(*) as count FROM labyrinths');
      const adminCount = await this.get('SELECT COUNT(*) as count FROM users WHERE is_admin = 1');

      return {
        totalUsers: userCount.count,
        totalLabyrinths: labyrinthCount.count,
        adminCount: adminCount.count
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      throw error;
    }
  }
}

module.exports = Database;
