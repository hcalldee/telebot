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
//haha
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

module.exports = {
    connection,
    insertData
};