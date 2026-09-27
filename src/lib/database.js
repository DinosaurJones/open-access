/**
 * Database utility functions for SQLite operations
 */
import { Database } from '@tauri-apps/plugin-sql';

/**
 * Get a database connection
 * @param {string} dbPath - Path to the SQLite database
 * @returns {Promise<Database>}
 */
export async function getDatabase(dbPath) {
  try {
    const db = await Database.load(`sqlite:${dbPath}`);
    return db;
  } catch (error) {
    console.error('Failed to open database:', error);
    throw new Error(`Failed to open database: ${error.message}`);
  }
}

/**
 * Execute a query and return results
 * @param {Database} db - Database connection
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
export async function executeQuery(db, query, params = []) {
  try {
    const result = await db.select(query, params);
    return result;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw new Error(`Query failed: ${error.message}`);
  }
}

/**
 * Get all tables in the database
 * @param {Database} db - Database connection
 * @returns {Promise<Array>}
 */
export async function getTables(db) {
  const query = `
    SELECT name, type
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `;
  return await executeQuery(db, query);
}

/**
 * Get table schema (columns)
 * @param {Database} db - Database connection
 * @param {string} tableName - Name of the table
 * @returns {Promise<Array>}
 */
export async function getTableSchema(db, tableName) {
  const query = `PRAGMA table_info(${tableName})`;
  return await executeQuery(db, query);
}

/**
 * Get all rows from a table
 * @param {Database} db - Database connection
 * @param {string} tableName - Name of the table
 * @returns {Promise<Array>}
 */
export async function getTableRows(db, tableName) {
  const query = `SELECT * FROM ${tableName}`;
  return await executeQuery(db, query);
}

/**
 * Insert a row into a table
 * @param {Database} db - Database connection
 * @param {string} tableName - Name of the table
 * @param {Object} data - Object with column names as keys
 * @returns {Promise<number>} - ID of the inserted row
 */
export async function insertRow(db, tableName, data) {
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(() => '?').join(', ');
  const values = Object.values(data);

  const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;

  try {
    await db.execute(query, values);
    const result = await db.select('SELECT last_insert_rowid() as id');
    return result[0]?.id || 0;
  } catch (error) {
    console.error('Insert failed:', error);
    throw new Error(`Insert failed: ${error.message}`);
  }
}

/**
 * Update a row in a table
 * @param {Database} db - Database connection
 * @param {string} tableName - Name of the table
 * @param {number} id - Row ID
 * @param {Object} data - Object with column names as keys
 * @returns {Promise<number>} - Number of affected rows
 */
export async function updateRow(db, tableName, id, data) {
  const idColumn = 'id';
  const setClause = Object.keys(data).map(col => `${col} = ?`).join(', ');
  const values = [...Object.values(data), id];

  const query = `UPDATE ${tableName} SET ${setClause} WHERE ${idColumn} = ?`;

  try {
    const result = await db.execute(query, values);
    return result.rowsAffected;
  } catch (error) {
    console.error('Update failed:', error);
    throw new Error(`Update failed: ${error.message}`);
  }
}

/**
 * Delete a row from a table
 * @param {Database} db - Database connection
 * @param {string} tableName - Name of the table
 * @param {number} id - Row ID
 * @returns {Promise<number>} - Number of affected rows
 */
export async function deleteRow(db, tableName, id) {
  const query = `DELETE FROM ${tableName} WHERE id = ?`;

  try {
    const result = await db.execute(query, [id]);
    return result.rowsAffected;
  } catch (error) {
    console.error('Delete failed:', error);
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Create a new table
 * @param {Database} db - Database connection
 * @param {string} tableName - Name of the new table
 * @param {Array} columns - Array of column definitions
 * @returns {Promise<void>}
 */
export async function createTable(db, tableName, columns) {
  const columnDefs = columns.map(col => {
    let def = `${col.name} ${col.type}`;
    if (col.primaryKey) def += ' PRIMARY KEY';
    if (col.autoIncrement) def += ' AUTOINCREMENT';
    if (col.notNull) def += ' NOT NULL';
    if (col.unique) def += ' UNIQUE';
    if (col.default) def += ` DEFAULT ${col.default}`;
    return def;
  }).join(', ');

  const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs})`;

  try {
    await db.execute(query);
  } catch (error) {
    console.error('Create table failed:', error);
    throw new Error(`Create table failed: ${error.message}`);
  }
}

/**
 * Drop a table
 * @param {Database} db - Database connection
 * @param {string} tableName - Name of the table to drop
 * @returns {Promise<void>}
 */
export async function dropTable(db, tableName) {
  const query = `DROP TABLE IF EXISTS ${tableName}`;

  try {
    await db.execute(query);
  } catch (error) {
    console.error('Drop table failed:', error);
    throw new Error(`Drop table failed: ${error.message}`);
  }
}

export default {
  getDatabase,
  executeQuery,
  getTables,
  getTableSchema,
  getTableRows,
  insertRow,
  updateRow,
  deleteRow,
  createTable,
  dropTable
};