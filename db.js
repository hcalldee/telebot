const mysql = require('mysql');
const config = require('./config');

const connection = mysql.createConnection(config.databaseConfig);

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database successfully.');
});
//hahahihi
function insertData(data) {
    return new Promise((resolve, reject) => {
        const { id, username, tanggal, sub_judul, durasi, perihal } = data;
        const sql = "INSERT INTO lembur_it (id, username, tanggal, sub_judul, durasi, perihal) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [id, username, tanggal, sub_judul, durasi, perihal];

        connection.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error inserting data:', err);
                reject(err);
            } else {
                console.log('Data inserted successfully.');
                resolve('success');
            }
        });
    });
}

function editData(id, data) {
    return new Promise((resolve, reject) => {
        const {tanggal, sub_judul, durasi, perihal } = data;
        const sql = "UPDATE lembur_it SET tanggal = ?, sub_judul = ?, durasi = ?, perihal = ? WHERE id = ?";
        const values = [tanggal, sub_judul, durasi, perihal, id];

        connection.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error updating data:', err);
                reject(err);
            } else {
                if (result.affectedRows > 0) {
                    console.log('Data updated successfully.');
                    resolve('success');
                } else {
                    console.log('No record found for the given id:', id);
                    resolve('not_found');
                }
            }
        });
    });
}

module.exports = {
    connection,
    insertData,
    editData
};