const cluster = require('cluster');
const os = require('os');



module.exports = {
  possibleWorkers: os.cpus().length,
  fork: function () {
    for (let i = 0; i < this.possibleWorkers; i++) {
      cluster.fork()
    }
  },
  logRequest: async function (request, response, next) {
    next()
    const origin = request.headers.origin
    console.log(`${new Date()} referer: ${origin} ${request.method}  ${request.baseUrl} ${request.url.split("?")[0]}`)
  },
  configurations: {
    hasInventorySubscribed: 0,
    strictBranchCheck: 1,
    multipleBranchesEnabled: 1,
    hasPurchaseManagement: 1,
  },
}