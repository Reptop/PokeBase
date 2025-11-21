const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'classmysql.engr.oregonstate.edu',
  user: 'cs340_kabirr',
  password: 'PASSWORD',
  database: 'cs340_kabirr',
});

module.exports = pool;

