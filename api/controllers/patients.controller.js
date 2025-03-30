const { customError, responseError } = require('../../helper');
const logger = require('../../logger');
const parent = require('express').Router();
const Patient = require('../models/patientAnalytics');

// api endpoints
// /api/v1/patients/transactions/dates  - retirves all the transactions of a pacticualr client grouped by the date
// -- request query---> from and to 
// FLOW
// - CHECK client Membership code 
// -IF EXIST -
// -- CHECK FOR BILLING GROUPED BY BILLING
// ELSE 
// --- SEND NOT A VALID ID
parent.get(
  "/api/v1/patients/analytics/date",
  async function (request, response) {
    const { patientid, from, to } = request.query;
    if (!patientid) {
      customError("Patientid not given", 401, response);
    } else {
      const init = new Patient(patientid);
      try {
        const data = await init.getTransactionsByDate(patientid, from, to);

        if (Array.isArray(data)) {
          response.send({ result: data, statusCode: 200, status: 'success' })
        } else {
          customError(data, 401, response)
        }
      } catch (err) {
        logger.error(err);
        customError(err.message, 500, response)
      }
    }
  }
);

parent.post('/api/v1/patients/updatecredentials', async function (request, response) {
  await new Patient().updateCredentials(request, response);
})

parent.put('/api/v1/patients/notifications', async function (request, response) {
  await new Patient().updateNotificationSettings(request, response);
})

parent.get("/api/v1/patients/filter", async function (request, response) {
  try {
    const { filter } = request.query;
    const filteredClients = await new Patient().filterPatientUsingClient(filter);
    response.send(filteredClients);
  } catch (err) {
    responseError(response);
  }
})




module.exports = parent