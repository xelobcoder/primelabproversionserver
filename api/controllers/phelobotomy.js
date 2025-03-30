const router = require('express').Router();
const { customError } = require('../../helper');
const ResultPrint = require('../models/ResultPrint');
const { getPhelobotomy, updatePhelobotomy, sampleAssesment,
postSection, get_client_query, getAscensionWithDetails } = require('../phelobotomy')


router.route('/api/v1/phelobotomy')
  .get(function (req, res) {
    getPhelobotomy(req, res);
    // if (Keys) {
    //   getPhelobotomy(req, res);
    // } else {
    //   if (!Keys && req.query.billingid) {
    //     get_client_query(req, res)
    //   }
    // }
  })
  .post(function (req, res) {
    postSection(req, res);
  })
  .put(function (req, res) {
    const { clientid, content, status, alltaken, completedTime } = req.body;
    updatePhelobotomy(clientid, content, status, alltaken, completedTime, req, res);
  })


router.get('/api/v1/phelobotomy/ascension', function (request, response) {
  const { billingid, state } = request.query;
  if (billingid && state) {
    getAscensionWithDetails(billingid,state, response)
  } else {
    response.send({
      message: "include billingid and state in the header as a query",
      statusCode: 401,
      status: "error",
    })
  }
})


router.get('/api/v1/phelobotomy/ascension/getsamplinginfo', async function (request, response) {
  const { billingid, testid } = request.query;
  if (!billingid || !testid) return customError('billingid and  testid are required', 404, response);
  const result = await new ResultPrint().getSamplingInformation(billingid, testid);
  response.send(result);
})



router.get('/api/v1/phelobotomy/sample/assesment/list', function (req, res) {
   sampleAssesment(req, res)
})



module.exports = router;
