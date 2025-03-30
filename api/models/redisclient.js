const redis = require("redis");

const client = redis.createClient({
     port: process.env.REDIS_PORT,
     host: 'localhost'
})


client.on("connect", () => {
     console.log('------------------------------------------------------------------');
     console.log('connection to redis server successfull')
});

client.on("error", (err) => {
     console.log('------------------------------------------------------------------');
     if (err.code == "ECONNREFUSED") {
          client.quit()
     }
});
client.on("ready", () => {
     console.log('------------------------------------------------------------------');
     console.log('client is connected and ready for use')
});

client.on("end", () => {
     console.log('------------------------------------------------------------------');
     console.log('redis client disconnected')
});

client.on("SIGINT", () => {
     console.log('------------------------------------------------------------------');
     client.quit()
});

module.exports = client;