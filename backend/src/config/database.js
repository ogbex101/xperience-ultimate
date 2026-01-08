const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'xperience_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
const testConnection = async () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('❌ Database connection failed:', err.message);
        reject(err);
      } else {
        console.log('✅ Database connected successfully');
        connection.release();
        resolve(true);
      }
    });
  });
};

// FIXED: Execute function that returns [rows, fields] structure like mysql2/promise
const execute = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.execute(sql, params, (error, results, fields) => {
      if (error) {
        console.error('Database execute error:', error);
        reject(error);
      } else {
        // Return the same structure as mysql2/promise: [rows, fields]
        resolve([results, fields]);
      }
    });
  });
};

// FIXED: Query function that returns [rows, fields] structure
const query = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (error, results, fields) => {
      if (error) {
        console.error('Database query error:', error);
        reject(error);
      } else {
        // Return the same structure as mysql2/promise: [rows, fields]
        resolve([results, fields]);
      }
    });
  });
};

// ADD THIS: Function to handle transactions properly
const executeTransaction = async (operations) => {
  // Get a connection from the pool
  const connection = await pool.promise().getConnection();
  
  try {
    // Start transaction using connection.beginTransaction() instead of START TRANSACTION
    await connection.beginTransaction();
    
    // Execute all operations
    const results = [];
    for (const operation of operations) {
      const { sql, params } = operation;
      const [result] = await connection.execute(sql, params);
      results.push(result);
    }
    
    // Commit transaction
    await connection.commit();
    
    return results;
  } catch (error) {
    // Rollback if any error occurs
    await connection.rollback();
    console.error('Transaction error:', error);
    throw error;
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
};

// ADD THIS: Simple transaction wrapper for single operations
const withTransaction = async (callback) => {
  const connection = await pool.promise().getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  testConnection,
  query,
  execute,
  executeTransaction,  // Export the new function
  withTransaction      // Export the wrapper
};

// Also export the pool as default for backward compatibility
module.exports.default = pool;