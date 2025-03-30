const winston = require('winston');

// Define the logger configuration
const logger = winston.createLogger({
  level: 'error', // Set the minimum logging level to 'error' or 'info', depending on your needs
  format: winston.format.json(), // Log data in JSON format
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }), // Log errors to a file
    new winston.transports.Console() // Log errors to the console
  ],
});

// Log uncaught exceptions to the error logger
process.on('uncaughtException', (ex) => {
  console.error('Uncaught Exception:', ex);
  process.exit(1); // Exit the application (or restart it) after an uncaught exception
});

// Log unhandled promise rejections to the error logger
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // You can decide whether to exit the application or handle it differently
});

module.exports = logger;
