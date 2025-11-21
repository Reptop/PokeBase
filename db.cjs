const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'classmysql.engr.oregonstate.edu',
  user: 'cs340_kabirr',
  password: 'PASSWORD', // yeah im aware this is bad practice
  database: 'cs340_kabirr',
});

module.exports = pool;

