const { createConnection } = require('mysql');
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
    database
}


const connection = createConnection(connectionData)

connection.connect(err => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }

        if (err.code === 'ER_DUP_ENTRY') {
            console.log('Duplicates values violation occured');
        }
    }
    else {
        console.log('Connected to database');
    }
})




module.exports = connection;
