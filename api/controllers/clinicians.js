const { getClinicians, putCliniciansbasic, deleteClinicians, getSingleClinician, postClinicianBasicInfo, getTopPerformingClinicians, getClinicianResult, getBillingTestBasedByClinician} = require('../../api/clinicians');
const { customError } = require('../../helper');
const logger = require('../../logger');
const EmailService = require("../EmailServices/EmailCore")
const {Billing }= require("../../api/billing");
const Registration = require('../models/registration');
const database_queries = require('../database/queries');

const router = require('express').Router();

router.get("/api/v1/clinicians", async (req, res) => {
  getClinicians(req, res)
})
router.get("/api/v1/clinicians/getclinician", async (req, res) => {
  const { id } = req.query
  if (!id) {
    return customError("clinicianid required", 404, res)
  } else {
    getSingleClinician(req, res)
  }
})
router.put('/api/v1/clinicians', async (req, res) => {
  putCliniciansbasic(req, res);
});

router.delete('/api/v1/clinicians', async (req, res) => {
  deleteClinicians(req, res);
});

router.post('/api/v1/clinicians', async (req, res) => {
  const outcome = await postClinicianBasicInfo(req, res);
  if (typeof outcome !== 'number' || typeof outcome === "string") {
    customError(outcome, 404, res); return;
  }
  res.send({ message: 'clinician added successfully', statusCode: 200, status: 'success' });
  await new EmailService().fireClientAuthentication(req.body?.email, "clinician", outcome);
});

router.get('/api/v1/clinician/performance/top', function(request,response) {
  getTopPerformingClinicians(request,response)
})

router.post('/api/v1/client/filter/clinician', async function (request, response) { 
  const { data } = request.body;
  if (!data) { customError('please add data', 401, response); return  };
  const result = await new Registration().filterPatientUsingClient(data);
  response.send({ status: 'success', statusCode: 200, result })
})


router.get('/api/v1/clinician/resultsets', async function (request, response) { 
  try {
    const { clinicianid, startdate, enddate } = request.query
    if (!clinicianid) {
      customError("please add clinicianid", 401, response);
      return
    } 
    const result = await getClinicianResult(clinicianid, startdate, enddate);
    response.send({ status: "success", statusCode: 200, result });
  } catch (err) {
    logger.error(err)
    customError(err, 401, response)
  }
})


router.get('/api/v1/clinician/resultsets/billingid', async function (request, response) {
  try { 
    const { billingid, clinicianid } = request.query;
    if (!billingid || !clinicianid) {
      customError("please add billingid and clinicianid", 401, response)
    } else {
      const result = await getBillingTestBasedByClinician(billingid, clinicianid);
     response.send({statusCode: 200, status: 'success', result})
    }
  } catch (err) {
    logger.error(err);
    customError(err?.message || 'something went wrong', 500, response);
  }
})


router.post('/api/v1/orders/temporary', async function (request, response) {
  try {
    const result = await new Registration().temporaryOrder(request.body);
    if(result == true) {
      response.send({statusCode: 200, status: 'success',message: "order added successfully"})
    } else {
      const message = result == false ? 'kindly update orders in the order page' : 'something went wrong while trying to add order';
      customError(message, 500, response)
    }
  } catch (err) {
    customError('Something wrong ocured', 500, response)
   }
})
 

router.get('/api/v1/orders/temporary', async function (request, response) {
  const { clinicianid ,target,date} = request.query;
  if (!target) {
    customError('please addd target for query ', 401, response);
    return;
  }
  try {
    const result = await new Registration().getTemporaryOrders(target,clinicianid,date);
    response.send({statusCode: 200, status: 'success', result})
  } catch (err) {
    customError('Something wrong ocured', 500, response)
  }
})



router.get('/api/v1/orders/temporary/processing', async function (request, response) { 
  const { orderid } = request.query;
  if (!orderid) customError('please add id', 401, response);
  try {
    let result = await new Registration().getTemporaryOrdersProcessing(orderid);
    response.send({statusCode: 200, status: 'success', result})
  } catch (err) {
    customError('Something wrong ocured', 500, response)
  }
})


router.post("/api/v1/orders/processed", async function (request, response) {
  try
  {
    const { patientid, clinician, organization, orderid, test, payable, testcost, paid, taxIncluded, taxValue, status, discount, paymentmode, samplingCenter, outstanding, cost, employeeid } = request.body;

    if (!employeeid || !clinician) {
      return customError('Bill can initiation failed, include employeeid and clincianid', 404, response);
    }

    const billing = new Billing(patientid, clinician, organization, test, payable, testcost, paid, taxIncluded, taxValue, status, discount, paymentmode, samplingCenter,
      outstanding, cost);
    
    const outcome = await billing.insertionProcess(request, response, employeeid, false);

    if (typeof outcome === "string") {
      return customError(outcome, 404, response);
    }
    if (typeof outcome === "boolean") {
      // we update the temporary orders
    if (outcome !== true) { customError("error in processsing order", 404, response); return; } 
      const isUpdated = await new Registration().updateProcessedOrder(orderid);
      if (!isUpdated) {
        customError("error processing order", 500, response); return;
      }
      response.send({ message: 'order processed successfully', statusCode: 200, status: "success" });
    }
  } 
  catch (err) 
  {
    console.log(err);
    customError(err?.message || err, 500, response);
  }
})

module.exports = router;