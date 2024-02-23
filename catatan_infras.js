const mysql = require('mysql');

class CRUDModule {
    constructor(dbConnection) {
        this.connection = dbConnection;
    }

    // Create operation
    create(item) {
        const insertQuery = 'INSERT INTO catatan_Infras SET ?';
        return new Promise((resolve, reject) => {
            this.connection.query(insertQuery, item, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: result.insertId, ...item });
                }
            });
        });
    }

    // Read operation
    read(id) {
        let query = 'SELECT * FROM catatan_Infras';
        if (id !== undefined) {
            query += ` WHERE id = ${id}`;
        }
        return new Promise((resolve, reject) => {
            this.connection.query(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    if (id !== undefined) {
                        resolve(rows[0]);
                    } else {
                        resolve(rows);
                    }
                }
            });
        });
    }

    // Update operation
    update(id, newData) {
        const updateQuery = 'UPDATE catatan_Infras SET ? WHERE id = ?';
        return new Promise((resolve, reject) => {
            this.connection.query(updateQuery, [newData, id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    if (result.affectedRows > 0) {
                        resolve({ id, ...newData });
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    // Delete operation
    delete(id) {
        const deleteQuery = 'DELETE FROM catatan_Infras WHERE id = ?';
        const resetAutoIncrementQuery = 'ALTER TABLE catatan_Infras AUTO_INCREMENT = 1';
        
        return new Promise((resolve, reject) => {
            this.connection.query(deleteQuery, id, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    if (result.affectedRows > 0) {
                        this.connection.query(resetAutoIncrementQuery, (resetErr, resetResult) => {
                            if (resetErr) {
                                reject(resetErr);
                            } else {
                                resolve({ id });
                            }
                        });
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }
}

module.exports = CRUDModule;