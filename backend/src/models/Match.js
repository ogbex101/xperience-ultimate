import db from '../config/database.js';

class Match {
  // Create a new 1v1 match
  static async createMatch(matchData) {
    const {
      player1_id,
      player2_id,
      game,
      stake_amount,
      prize_pool_option,
      custom_prize_pool,
      scheduled_at
    } = matchData;

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Calculate prize pool
      let prize_pool_amount = 0;
      if (prize_pool_option === 'entry_fee') {
        prize_pool_amount = stake_amount * 0.85; // 15% platform fee
      } else {
        prize_pool_amount = custom_prize_pool * 0.85;
      }

      // Validate custom prize pool
      if (prize_pool_option === 'custom' && custom_prize_pool < stake_amount) {
        throw new Error('Custom prize pool cannot be less than stake amount');
      }

      // Check player balances
      const [player1] = await connection.query(
        'SELECT balance FROM users WHERE id = ?',
        [player1_id]
      );
      const [player2] = await connection.query(
        'SELECT balance FROM users WHERE id = ?',
        [player2_id]
      );

      if (player1[0].balance < stake_amount) {
        throw new Error('Player 1 has insufficient balance');
      }
      if (player2[0].balance < stake_amount) {
        throw new Error('Player 2 has insufficient balance');
      }

      // Deduct stakes from both players
      await connection.query(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [stake_amount, player1_id]
      );
      await connection.query(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [stake_amount, player2_id]
      );

      // Create match record
      const [result] = await connection.query(`
        INSERT INTO matches (
          player1_id, player2_id, game, stake_amount, prize_pool_option,
          custom_prize_pool, prize_pool_amount, scheduled_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        player1_id, player2_id, game, stake_amount, prize_pool_option,
        custom_prize_pool, prize_pool_amount, scheduled_at
      ]);

      // Create transaction records
      const reference = `MATCH-STAKE-${Date.now()}-${result.insertId}`;
      
      await connection.query(`
        INSERT INTO transactions (user_id, amount, type, status, reference, description)
        VALUES (?, ?, 'match_stake', 'completed', ?, ?)
      `, [player1_id, -stake_amount, reference, `Stake deduction for 1vs1 match #${result.insertId}`]);

      await connection.query(`
        INSERT INTO transactions (user_id, amount, type, status, reference, description)
        VALUES (?, ?, 'match_stake', 'completed', ?, ?)
      `, [player2_id, -stake_amount, reference, `Stake deduction for 1vs1 match #${result.insertId}`]);

      // Track platform revenue
      const platformFee = prize_pool_option === 'entry_fee' ? 
        stake_amount * 0.15 : custom_prize_pool * 0.15;
      
      await connection.query(`
        INSERT INTO revenue (amount, revenue_date, notes)
        VALUES (?, NOW(), ?)
      `, [platformFee, `15% platform fee from 1vs1_match`]);

      await connection.commit();
      return result.insertId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Submit match result
  static async submitResult(matchId, userId, winnerId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get match details
      const [matches] = await connection.query(`
        SELECT * FROM matches WHERE id = ?
      `, [matchId]);

      if (matches.length === 0) {
        throw new Error('Match not found');
      }

      const match = matches[0];

      // Verify user is part of the match
      if (match.player1_id !== userId && match.player2_id !== userId) {
        throw new Error('Not authorized to submit result for this match');
      }

      // Verify winner is part of the match
      if (match.player1_id !== winnerId && match.player2_id !== winnerId) {
        throw new Error('Winner must be one of the match participants');
      }

      // Check if result already submitted by this user
      const [existing] = await connection.query(`
        SELECT * FROM match_results 
        WHERE match_id = ? AND user_id = ?
      `, [matchId, userId]);

      if (existing.length > 0) {
        throw new Error('Result already submitted');
      }

      // Submit result
      await connection.query(`
        INSERT INTO match_results (match_id, user_id, winner_id)
        VALUES (?, ?, ?)
      `, [matchId, userId, winnerId]);

      // Check if both players submitted results
      const [results] = await connection.query(`
        SELECT * FROM match_results WHERE match_id = ?
      `, [matchId]);

      // If both players submitted and agree on winner
      if (results.length === 2) {
        const winner1 = results[0].winner_id;
        const winner2 = results[1].winner_id;

        if (winner1 === winner2) {
          // Players agree on winner - complete match
          await this.completeMatch(matchId, winner1, connection);
        } else {
          // Dispute - set match to disputed status
          await connection.query(`
            UPDATE matches SET status = 'disputed' WHERE id = ?
          `, [matchId]);
        }
      }

      await connection.commit();
      return { message: 'Result submitted successfully' };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Complete match and distribute winnings
  static async completeMatch(matchId, winnerId, connection) {
    // Get match details
    const [matches] = await connection.query(`
      SELECT * FROM matches WHERE id = ?
    `, [matchId]);

    const match = matches[0];

    // Determine loser
    const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id;

    // Distribute winnings to winner
    const winnings = match.prize_pool_amount + match.stake_amount;

    await connection.query(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [winnings, winnerId]
    );

    // Update match status
    await connection.query(`
      UPDATE matches 
      SET status = 'completed', winner_id = ?, completed_at = NOW()
      WHERE id = ?
    `, [winnerId, matchId]);

    // Create transaction for winnings
    await connection.query(`
      INSERT INTO transactions (user_id, amount, type, status, reference, description)
      VALUES (?, ?, 'winning', 'completed', ?, ?)
    `, [
      winnerId,
      winnings,
      `MATCH-WIN-${Date.now()}-${matchId}`,
      `Match winnings from 1vs1 match #${matchId} (including returned stake)`
    ]);

    // Update player stats
    await connection.query(`
      UPDATE users 
      SET wins = wins + 1, matches_played = matches_played + 1
      WHERE id = ?
    `, [winnerId]);

    await connection.query(`
      UPDATE users 
      SET losses = losses + 1, matches_played = matches_played + 1
      WHERE id = ?
    `, [loserId]);

    // Update win rates
    await connection.query(`
      UPDATE users 
      SET win_rate = ROUND((wins * 100.0) / matches_played, 2)
      WHERE id IN (?, ?)
    `, [winnerId, loserId]);
  }

  // Get user's match history
  static async getUserMatches(userId) {
    const [matches] = await db.query(`
      SELECT 
        m.*,
        p1.username as player1_username,
        p1.rank as player1_rank,
        p1.profile_pic as player1_avatar,
        p2.username as player2_username,
        p2.rank as player2_rank,
        p2.profile_pic as player2_avatar,
        w.username as winner_username
      FROM matches m
      LEFT JOIN users p1 ON m.player1_id = p1.id
      LEFT JOIN users p2 ON m.player2_id = p2.id
      LEFT JOIN users w ON m.winner_id = w.id
      WHERE m.player1_id = ? OR m.player2_id = ?
      ORDER BY m.created_at DESC
    `, [userId, userId]);

    return matches;
  }

  // Get match details
  static async getMatch(matchId) {
    const [matches] = await db.query(`
      SELECT 
        m.*,
        p1.username as player1_username,
        p1.rank as player1_rank,
        p1.profile_pic as player1_avatar,
        p2.username as player2_username,
        p2.rank as player2_rank,
        p2.profile_pic as player2_avatar,
        w.username as winner_username
      FROM matches m
      LEFT JOIN users p1 ON m.player1_id = p1.id
      LEFT JOIN users p2 ON m.player2_id = p2.id
      LEFT JOIN users w ON m.winner_id = w.id
      WHERE m.id = ?
    `, [matchId]);

    return matches[0] || null;
  }

  // Get open challenges for a game
  static async getOpenChallenges(game) {
    const [matches] = await db.query(`
      SELECT 
        m.*,
        p1.username as player1_username,
        p1.rank as player1_rank
      FROM matches m
      LEFT JOIN users p1 ON m.player1_id = p1.id
      WHERE m.game = ? AND m.status = 'pending'
      ORDER BY m.created_at DESC
    `, [game]);

    return matches;
  }
}

export default Match;