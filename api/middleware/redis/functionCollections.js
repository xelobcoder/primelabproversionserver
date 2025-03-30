const redisClient = require('../../models/redisclient');

async function useRedisCollection(request, response, next, sessioname) {
   if (typeof request != 'object' || typeof response != 'object') {
      throw new TypeError('http request and response required');
   }
   if (!next || typeof next != 'function') {
      throw new Error('next callback required')
   }
   await redisClient.connect();
   const data = await redisClient.get(sessioname);
   await redisClient.disconnect();
   if (!data) return next();
   response.send({ result: JSON.parse(data), statusCode: 200, status: 'success', caches: true });
}


module.exports = useRedisCollection;