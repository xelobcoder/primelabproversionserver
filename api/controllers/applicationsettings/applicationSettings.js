const router = require('express').Router()
const { customError, rowAffected, responseError } = require("../../../helper")
const ApplicationSettings = require("../../models/application/settings")
const Tax = require("../../models/application/tax")
const ResultSettings = require("../../models/application/results")
const logger = require('../../../logger')
const appsettings = new ApplicationSettings()
const tax = new Tax()
const result = new ResultSettings()

router.get("/api/v1/applicationsettings", function (request, response) {
  appsettings.getApplicationSettings(request, response)
})
router.get("/api/v1/applicationsettings/billing", function (request, response) {
  appsettings.getApplicationSettingsBilling(request, response)
})

router.post("/api/v1/applicationsettings", function (request, response) {
  appsettings.updateApplicationSettings(request, response)
})

router.put("/api/v1/applicationsettings/smsupdate", function (request, response) {
  appsettings.updateSmsSettings(request, response)
})

router.get("/api/v1/applicationsettings/smsupdate", function (request, response) {
  appsettings.getSmsSettings(request, response)
})

router.get("/api/v1/applicationssettings/emailpreference", async function (request, response) {
  try {
    const result = await appsettings.getEmailPreference()
    response.send({ message: "success", status: "success", statusCode: 200, result })
  } catch (err) {
    customError("something went wrong", 500, response)
  }
})

router.get("/api/v1/applicationssettings/email/emailsettings", async function (request, response) {
  try {
    const result = await appsettings.getGeneralEmailSettings()
    response.send({ message: "success", status: "success", statusCode: 200, result })
  } catch (err) {
    customError("something went wrong", 500, response)
  }
})

router.put("/api/v1/applicationssettings/email/emailsettings", async function (request, response) {
  try {
    const result = await appsettings.updateGeneralEmailSettings(request.body)
    response.send({
      message: rowAffected(result) ? "updated successfully" : "No updates effected",
      status: "success",
      statusCode: 200,
    })
  } catch (err) {
    customError("something went wrong", 500, response)
  }
})

router.post("/api/v1/applicationssettings/emailpreference", function (request, response) {
  appsettings.updateEmailPreference(request, response)
})

router.post("/api/v1/applicationsettings/registration/fields", async function (request, response) {
  try {
    const result = await appsettings.updateRegistrationFields(request, response)
    if (result === true) {
      response.send({ message: "fields updated successfully", statusCode: 200, status: "success" })
    } else {
      response.send({ message: "fields update failed", statusCode: "error", status: "error" })
    }
  } catch (err) {
    logger.error(err);
    responseError(response)
  }
})

router.get("/api/v1/applicationsettings/registration/fields", async function (request, response) {
  try {
    let result = await appsettings.getRegistrationSettings()
    if (result.length > 0) {
      result = result[0]["fields"]
      if (result != "{}") {
        return response.send(result)
      }
      response.send(result)
    } else {
      return response.send({})
    }
  } catch (err) {
    responseError(response)
  }
})

router.post("/api/v1/application/tax", function (request, response) {
  tax.addTax(request, response)
})

router.get('/api/v1/application/tax', async function (request, response) {
  tax.getTax(request, response);
})

router.put("/api/v1/application/tax", function (request, response) {
  tax.updateTax(request, response);
})

router.put("/api/v1/application/tax/activation", async function (request, response) {
  tax.changeTaxStatus(request, response);
})

router.delete("/api/v1/application/tax", async function (request, response) {
  tax.deleteTax(request, response);
})


router.get("/api/v1/applicationsetting/resultsettings", async function (request, response) {
  result.getResultSettings(request, response);
})

router.put("/api/v1/applicationsetting/resultsettings", async function (request, response) {
  result.updateResultSettings(request, response);
})

module.exports = router;
