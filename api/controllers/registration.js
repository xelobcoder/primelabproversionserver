const router = require('express').Router();
const { customError, convertKeysToLowerCase } = require('../../helper');
const database_queries = require('../database/queries');
const Registration = require('../models/registration');
const EmailService = require("../EmailServices/EmailCore")


router.post("/api/v1/register", async (request, response) => {
  const register = new Registration()
  const emailSevice = new EmailService()
  const outcome = await register.addNewPatient(request, response)
  if (typeof outcome == "number") {
    response.send({
      statusCode: 200, status: "success",
      message: "Patient registered successfully",
      patientid: outcome
    });
    await emailSevice.fireClientAuthentication(outcome)
  }
})

router.put("/api/v1/register/personalinformation", async (request, response) => {
  const { patientid } = request.query
  if (!patientid) {
    customError(`patientid not included in the request`, 400, response)
  } else {
    await new Registration(patientid).UpdatePersonalInformation(request, response)
  }
})

router.put("/api/v1/register/emmergencycontactinformation", async (request, response) => {
  const { patientid } = request.query
  if (!patientid) {
    customError(`patientid not included in the request`, 400, response)
  } else {
    const result = await new Registration(patientid).emmergencyInformation(patientid, request.body)
    console.log(result)
    if (result === true) {
      response.send({
        message: "record updated successfully",
        statusCode: 200,
        status: "success",
      })
    } else {
      response.send({
        message: "No record updated",
        statusCode: 200,
        status: "error",
      })
    }
  }
})

router.put("/api/v1/register/addressinginformation", async (request, response) => {
  const { patientid } = request.query
  if (!patientid || patientid == "undefined") {
    customError(`patientid not included in the request`, 400, response)
  } else {
    const records = request.body
    const info = await new Registration(patientid).addressingInformation(patientid, records)
    if (info === true) {
      response.send({
        message: "record updated successfully",
        statusCode: 200,
        status: "success",
      })
    } else {
      response.send({
        message: "No record updated",
        statusCode: 200,
        status: "success",
      })
    }
  }
})

router.get("/api/v1/register/personalinformation", async (request, response) => {
  const { patientid } = request.query
  if (!patientid || patientid == "undefined" || patientid == 'null') {
    return customError(`patientid not included in the request`, 400, response)
  } else {
    const data = await database_queries.getsingleid(parseInt(patientid), "new_patients", "PATIENTID")
    if (data.length > 0) {
      const dataOne = convertKeysToLowerCase(data[0])
      dataOne.maritalstatus = dataOne.marital_status
      dataOne.mobile = parseInt(dataOne.mobile_number)
      dataOne.patientOrganization = dataOne.organization
      const date = new Date(dataOne.dob)
      delete dataOne.marital_status
      delete dataOne.mobile_number
      delete dataOne.organization
      dataOne.years = date.getFullYear()
      dataOne.months = date.getMonth() + 1
      dataOne.days = date.getDate()
      dataOne.ageType = dataOne["agetype"]
      delete dataOne.agetype
      response.send({ statusCode: 200, status: "success", result: dataOne })
    } else {
      response.send({ statusCode: 200, status: "success", result: [] })
    }
  }
})

router.get("/api/v1/register/checkmobile", async (request, response) => {
  const { mobileno } = request.query
  if (!mobileno) {
    return customError(`mobileno not included in the request`, 400, response)
  } else {
    const data = await database_queries.getsingleid(mobileno, "new_patients", "mobile_number")
    if (data.length > 0) {
      response.send({ statusCode: 200, status: "success", exist: true })
    } else {
      response.send({ statusCode: 200, status: "success", exist: false })
    }
  }
})

router.get("/api/v1/register/addressingformation", async (request, response) => {
  const { patientid } = request.query
  if (!patientid) {
    customError(`patientid not included in the request`, 400, response)
  } else {
    const data = await database_queries.getsingleid(patientid, "patientsaddress", "patientid")
    if (data.length > 0) {
      response.send({ statusCode: 200, status: "success", result: data[0] })
    } else {
      response.send({ statusCode: 200, status: "success", result: [] })
    }
  }
})
router.get("/api/v1/register/emmergencycontactinformation", async (request, response) => {
  const { patientid } = request.query
  if (!patientid) {
    customError(`patientid not included in the request`, 400, response)
  } else {
    const data = await database_queries.getsingleid(patientid, "patientemmergencycontactinformation", "patientid")
    if (data.length > 0) {
      response.send({ statusCode: 200, status: "success", result: data[0] })
    } else {
      response.send({ statusCode: 200, status: "success", result: [] })
    }
  }
})

router.get('/api/v1/register/registration/settings', async (request, response) => {
  const settings = await (new Registration().isBulkRegistration());
  response.send({
    status: "success",
    message: "settings retrieved successfully",
    statusCode: 200,
    bulkRegistration: settings
  });
})


module.exports = router;