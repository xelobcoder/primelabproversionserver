const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

const username = process.env.NODE_ENV == 'development' ?
  process.env.DEVELOPMENT_DB_USERNAME : process.env.PRODUCTION_DB_USERNAME;

const password = process.env.NODE_ENV == 'development' ?
  process.env.DEVELOPMENT_DB_PASSWORD : process.env.PRODUCTION_DB_PASSWORD;

const host = process.env.NODE_ENV == 'development' ?
  process.env.DEVELOPMENT_DB_HOST : process.env.PRODUCTION_DB_HOSTNAME;

const database = process.env.NODE_ENV == 'development' ?
  process.env.DEVELOPMENT_DATABASE : process.env.PRODUCTION_DATABASE;

const connectionData = {
  host: host,
  user: username,
  password: password,
  database,
  connectionLimit: 1000,
}



const connectionpool = mysql.createPool({ ...connectionData ,timeout:1000*60});



function handleConnection(errcode, err) {
  switch (errcode) {
    case 'PROTOCOL_CONNECTION_LOST':
      console.error('Database connection was closed.');
      break;
    case 'ER_CON_COUNT_ERROR':
      console.error("Database has too many connections");
      break;
    case 'ECONNREFUSED':
      console.error('Database connection was refused.');
      break;
    case 'ER_DUP_ENTRY':
      console.error('Duplicates values violation occured');
      break;
    default:
      console.log(err)
      throw err;
  }
}

connectionpool.getConnection((err, connection) => {
  if (err) {
    console.log(err)
    handleConnection(err.errcode, err);
  }
  connection.release();
});



module.exports = connectionpool;