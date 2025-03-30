const router = require('express').Router();
const { customError, responseError } = require("../../helper")
const ResultPrint = require("../models/ResultPrint")
const EmailService = require("../EmailServices/EmailCore")
const { getBillingInvoiceData } = require("../models/invoice")
const Payment = require("../models/payment")
const logger = require("../../logger")
const PDFGENERATION = require("../models/pdfGeneration")
const payment = new Payment()

router.get("/api/v1/result/ready", async function (req, res) {
  new ResultPrint().get_printables(req, res)
})

router.get("/api/v1/ready/crm/summary/advanced", function (request, response) {
  new ResultPrint().advancedTablesSearch(request, response)
})

router.get("/api/v1/result/ready/:id", async (req, res) => {
  const billingid = parseInt(req.params.id.slice(1))
  if (!billingid) return customError('billingid not provided', 404, response);
  await new ResultPrint().get_extrainfo_test(billingid, res)
})

router.post("/api/v1/result/ready/updateprint/count", async function (request, response) {
  try {
    const { id, count } = request.body
    if (!id || !count) return customError("test ascension id and count  of print required", 404, response)
    const result = await new ResultPrint().updatePrintCount(id, count)
    response.send({ status: result === true ? "success" : "failed" })
  } catch (err) {
    logger.error(err)
    responseError(response)
  }
})

router.get("/api/v1/result/ready/crm/summary", (req, res) => {
  new ResultPrint().get_summary_ready_page(req, res)
})

router.get("/api/v1/billing/payment/info/client", async (request, response) => {
  try {
    const result = await payment.getClientTransactionInformation(request.query, response)
    response.send({ result, statusCode: 200, status: "success" })
  } catch (err) {
    customError(err?.message, 500, response)
  }
})

router.get("/api/v1/billing/client/bulk/outstanding", async function (request, response) {
  const { patientid } = request.query
  if (!patientid) {
    customError(`patientid required`, 404, response)
  } else {
    const result = await payment.allClientDebtTransactions(patientid)
    response.send({ result, statusCode: 200, status: "success" })
  }
})

router.post("/api/v1/billing/client/clear/outstandingdebt", async function (request, response) {
  try {
    const { patientid, paymentmode, amountpaid, employeeid } = request.body
    if (!patientid || !paymentmode || !amountpaid || !employeeid) {
      return customError("include amountpaid, paymentmode,employeeid and patientid in request body", 404, response)
    }
    const result = await payment.clearClientDebtBulk(patientid, amountpaid, paymentmode, employeeid)
    if (result === true) {
      response.send({ message: "updated successfully", status: "success", statusCode: "200" })
    } else if (result == "No Exist") {
      response.send({ message: "No debt available to clear", status: "error", statusCode: "500" })
    } else {
      response.send({ message: "updated failed", status: "failed", statusCode: "500" })
    }
  } catch (err) {
    responseError(response)
  }
})
router.get("/api/v1/paymentmodes", function (request, response) {
  payment.paymentMode(request, response)
})

router.get("/api/v1/billing/client/transactionhx", function (request, response) {
  payment.specificBillTransactionHx(request, response)
})

router.post("/api/v1/billing/payment/update", function (request, response) {
  payment.updatePayment(request, response)
})

router.get("/api/v1/result/preview", function (request, response) {
  try {
    new ResultPrint().previewReport(request, response)
  } catch (err) {
    logger.error(err)
  }
})

router.get("/api/v1/result/preview/comments", function (request, response) {
  const { billingid, testid } = request.query
  if (billingid) {
    new ResultPrint().getComments(billingid, testid, response)
  } else {
    response.send({ status: "error", statusCode: 401, message: "Include Billingid " })
  }
})

router.get('/api/v1/result/preview/entry/scientist', async function (request, response) {
  const { testid, billingid } = request.query;
  if (!billingid || !testid) {
    return customError('billingid or testid not included in the query', 404, response);
  }
  const result = await new ResultPrint().getResultEntryScientist(billingid, testid);
  response.send(result);
})

// this check if test for a client  is approved  for printing
router.post("/api/v1/test/result/preview/approved/check", function (request, response) {
  const { billingid, testid } = request.body
  if (billingid && testid) {
    new ResultPrint().checkApproval(billingid, testid, response)
  } else {
    response.status(401).json({ status: "error", message: "include testid and billing in request body" })
  }
})

router.post("/api/v1/result/approve", function (request, response) {
  new ResultPrint().makeDecisionOnResult(request, response)
})

router.get("/api/v1/billing/invoice", function (request, response) {
  const { billingid } = request.query
  getBillingInvoiceData(billingid, response)
})

router.get("/api/v1/billing/email/receipt", async function (request, response) {
  const { billingid } = request.query
  if (billingid) {
    await new EmailService().forwardBillingReceipt(billingid)
  } else {
    customError(`billing id required`, 404, response)
  }
})

router.get("/billing/result/pdf", async function (request, response) {
  const { billingid, testname, testid } = request.query
  try {
    if (billingid && testname && testid) {
      try {
        const pdfgenerate = new PDFGENERATION(billingid, testid, testname)
        await  pdfgenerate.generatePDFResult(response);
      } catch (error) {
        customError("error fetching data", 500, response)
      }
    } else {
      customError("include billingid, testname and testid", 404, response)
    }
  } catch (err) {
    console.log(err)
  }
})


router.get("/api/v1/result/printout/approved/test", async function (request, response) {
  try {
    const { billingid } = request.query;
    const result = await new ResultPrint().getTransactionApprovedTest(billingid);
    response.send(result);
  } catch (err) {
    responseError(response);
  }
}) 

router.get("/billing/receipt", async function (request, response) {
  const { billingid } = request.query
  if (!billingid) {
    customError("billingid not provided", 404, response)
  } else {
  }
})

module.exports = router;