const { customError } = require("../../../helper");
const client = require("../../models/redisclient");
const useRedisCollection = require("./functionCollections");

module.exports = function (request, response, next) {
     if (!client) {
          console.log('redis client inactive')
          // incase we dont have a valid redis client, we just want to move to the next stage without having any issue
          return next();
     }

     if (!request.method == "GET") return next();
     async function gRedisStockCategory(request, response, next) {
          useRedisCollection(request, response, next, "STOCKS_CATEGORY")
     }
     async function getRegFields(request, response, next) {
          useRedisCollection(request, response, next, 'REG_FIELDS')
     }
     async function validateCacheToken(request, response, next) {
          const { token } = request.query;
          if (!token) {
               return customError('token not provided', 404, response);
          }
          await client.connect();
          const istoken = await client.get('SESSION_TOKEN');
          await client.disconnect();
          if (!istoken) return next();
          return response.send({ token })
     }

     const BASEURL = "/api/v1";
     const definers = [
          { endpoint: `${BASEURL}/stock/category`, callback: gRedisStockCategory },
          { endpoint: `${BASEURL}/applicationsettings/registration/fields`, callback: getRegFields },
          { endpoint: `${BASEURL}/authenticate/employee/token`, callback: validateCacheToken }
     ];
     var found = definers.find((a, i) => {
          let url = request.url;
          if (url.toString().includes('?')) {
               url = url.split("?");
               url = url[0];
               return url == a.endpoint;
          }
          return url == a.endpoint;
     })
     
     if (found) {
          if (found.callback && typeof found.callback == "function") {
               return found.callback(request, response, next)
          }
          next();
     }
     else next()
}
