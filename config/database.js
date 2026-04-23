import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', process.env.DB_FILE || 'yzy_vnyl.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
    }
});

export async function query(sql, values = []) {
    return new Promise((resolve, reject) => {
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sql, values, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
            db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ insertId: this.lastID, changes: this.changes });
                }
            });
        } else {
            db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        }
    });
}

export async function executeTransaction(queries) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                let completed = 0;
                let hasError = false;

                queries.forEach(([sql, values]) => {
                    if (hasError) return;

                    db.run(sql, values, (err) => {
                        if (err) {
                            hasError = true;
                            db.run('ROLLBACK', () => {
                                reject(err);
                            });
                            return;
                        }

                        completed++;
                        if (completed === queries.length) {
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve({ success: true });
                                }
                            });
                        }
                    });
                });
            });
        });
    });
}

export function getConnection() {
    return db;
}

export default db;

