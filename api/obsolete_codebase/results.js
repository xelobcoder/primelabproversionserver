const router = require("express").Router()
const { customError, rowAffected, promisifyQuery, responseError } = require("../../helper")
const logger = require("../../logger")
const Creator = require("../models/creator")
const Operations = require("../models/operations")
const Patient = require("../models/patientAnalytics")
const testpanel = require("../testpanel/list")

router.get(`/api/v1/result/patientrend/single`, async function (request, response) {
  const { billingid, patientid, testid, test, instances } = request.query
  try {
    const result = await new Patient(patientid).getPatientTestTrend(parseInt(patientid), testid, test, instances)
    response.send({ statusCode: 200, status: "success", result })
  } catch (err) {
    logger.error(err)
    customError("error occured", 500, response)
  }
})

router.post("/api/v1/result/entry/customtest", function (request, response) {
  try { new Creator().resultEntry(request, response) } catch (err) { responseError(response) }
})



module.exports = router
