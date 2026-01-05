import { query } from '../config/database.js';
import bcrypt from 'bcrypt';

export class User {
  // Create new user
  static async create(userData) {
    const {
      username,
      email,
      password,
      firstname = null,
      lastname = null
    } = userData;

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate wallet account number
    const walletAccountNumber = `XP${Date.now().toString().slice(-8)}`;

    const result = await query(
      `INSERT INTO users 
       (username, email, firstname, lastname, password, wallet_account_number, currency) 
       VALUES (?, ?, ?, ?, ?, ?, 'NGN')`,
      [username, email, firstname, lastname, hashedPassword, walletAccountNumber]
    );

    return result.insertId;
  }

  // Find user by email
  static async findByEmail(email) {
    const users = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }

  // Find user by username
  static async findByUsername(username) {
    const users = await query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return users[0] || null;
  }

  // Find user by ID
  static async findById(id) {
    const users = await query(
      `SELECT id, username, email, firstname, lastname, profile_pic, rank,
              matches_played, wins, losses, win_rate, balance, wallet_account_number,
              currency, created_at, is_banned
       FROM users WHERE id = ?`,
      [id]
    );
    return users[0] || null;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user profile
  static async updateProfile(userId, updateData) {
    const allowedFields = ['firstname', 'lastname', 'profile_pic'];
    const fieldsToUpdate = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        fieldsToUpdate[key] = updateData[key];
      }
    });

    if (Object.keys(fieldsToUpdate).length === 0) {
      return null;
    }

    const setClause = Object.keys(fieldsToUpdate)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(fieldsToUpdate), userId];

    await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    return this.findById(userId);
  }

  // Update user stats after match
  static async updateStats(userId, isWinner) {
    if (isWinner) {
      await query(
        `UPDATE users 
         SET wins = wins + 1, 
             matches_played = matches_played + 1,
             win_rate = ROUND((wins + 1) * 100.0 / (matches_played + 1), 2)
         WHERE id = ?`,
        [userId]
      );
    } else {
      await query(
        `UPDATE users 
         SET losses = losses + 1, 
             matches_played = matches_played + 1,
             win_rate = ROUND(wins * 100.0 / (matches_played + 1), 2)
         WHERE id = ?`,
        [userId]
      );
    }

    // Check for rank promotion
    await this.checkRankPromotion(userId);
  }

  // Check and update user rank
  static async checkRankPromotion(userId) {
    const user = await this.findById(userId);
    if (!user) return;

    const rankRequirements = await query(
      'SELECT * FROM rank_requirements ORDER BY min_wins DESC'
    );

    for (const requirement of rankRequirements) {
      if (user.wins >= requirement.min_wins && 
          user.matches_played >= requirement.min_matches &&
          user.win_rate >= requirement.win_rate) {
        
        if (user.rank !== requirement.rank) {
          await query(
            'UPDATE users SET rank = ? WHERE id = ?',
            [requirement.rank, userId]
          );
          
          // Here you would typically send a notification
          console.log(`User ${user.username} promoted to ${requirement.rank} rank`);
        }
        break;
      }
    }
  }

  // Set transaction PIN
  static async setTransactionPin(userId, pin) {
    const hashedPin = await bcrypt.hash(pin, 10);
    await query(
      'UPDATE users SET transaction_pin = ?, pin_set_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPin, userId]
    );
  }

  // Verify transaction PIN
  static async verifyTransactionPin(userId, pin) {
    const users = await query(
      'SELECT transaction_pin FROM users WHERE id = ?',
      [userId]
    );
    
    if (!users[0] || !users[0].transaction_pin) {
      return false;
    }

    return await bcrypt.compare(pin, users[0].transaction_pin);
  }
}