const { promisifyQuery, rowAffected, customError, responseError } = require("../../../helper")
const logger = require("../../../logger")
const Creator = require("../../models/creator")
const TestSetup = require("../../models/testSetup.model")
const { getCategory, postCategory } = require("../../testpanel/categories")
const testpanel = require("../../../dist/testpanel/list")

const router = require("express").Router()

router.get("/api/v1/testpanel/categories", (req, res) => {
  getCategory(req, res)
})

router.post("/api/v1/testpanel/categories", (req, res) => {
  postCategory(req, res)
})

router.get("/api/v1/testpanel/list", (req, res) => {
  testpanel.testpanel.getPanels(req, res)
})

router.get("/api/v1/testpanel/list/bulk", (req, res) => {
  testpanel.testpanel.getpanelsbulk(req, res)
})

router.post("/api/v1/testpanel/list/createcustom", async function (request, response) {
  try {
    const { stage } = request.query
    if (!stage) return customError("stage not included in request query", 404, response)

    if (stage == 1) {
      const { name } = request.body
      if (!name) return customError("testname required", 404, response)
      const isSuccess = await testpanel.createCustomTest(name)
      if (isSuccess === "EXIST") {
        return customError("test with same name is available", 404, response)
      }
      response.send({ status: isSuccess ? "success" : "failed" })
    }
  } catch (err) {
    responseError(response)
  }
})
router.get("/api/v1/gettestpanel/edit", async function (request, response) {
  try {
    const { id } = request.query
    if (!id) return customError("testid is required", 404, response)
    const result = await testpanel.testpanel.getPanelEditSingle(id)
    response.send(result.length > 0 ? result[0] : {})
  } catch (err) {
    responseError(response)
  }
})
router.put("/api/v1/test/updateprocedureManual", async function (request, response) {
  const { proceduremanual, employeeid, testid, title } = request.body
  if (!proceduremanual || !employeeid || !testid) {
    return customError("emplyeeid , testid and proceduremanual are required", 404, response)
  }
  const isUpdated = await testpanel.testpanel.updateProcedureManual(proceduremanual, parseInt(testid), parseInt(employeeid), title)
  response.send({ status: isUpdated === true ? "success" : "failed" })
})

router.get("/api/v1/test/getProcedureManual", async function (request, response) {
  try {
    const { testid } = request.query
    if (!testid) {
      return customError("testid is required", 404, response)
    }
    const result = await testpanel.testpanel.getProcedureManuel(testid)
    response.send(result)
  } catch (err) {
    responseError(err)
  }
})
router.get("/api/v1/test/getLiteraturereview", async function (request, response) {
  try {
    const { testid } = request.query
    if (!testid) {
      return customError("testid is required", 404, response)
    }
    const result = await new TestSetup().getSetupLiterature(testid);
    if (result.length > 0) {
      response.send(result[0])
    } else {
      response.send({})
    }
  } catch (err) {
    responseError(response)
  }
})

router.put("/api/v1/test/getLiteraturereview", async function (request, response) {
  try {
    const { testid, literature } = request.body;
    if (!testid) return customError("testid is required", 404, response);
    const update = rowAffected(await new TestSetup().updateSetupLiterature(literature, testid));
    response.send({ status: update ? 'success' : "failed" });
  } catch (err) {
    logger.error(err);
    responseError(response)
  }
})


router.get('/api/v1/test/isLiteraturereview/getLiterature', async function (request, response) {
  try {
    const { testid } = request.query;
    if (!testid)
      return customError("testid is required", 404, response);
    const result = await new TestSetup().getResultLiterature(testid);
    response.send(result);
  } catch (err) {
    responseError(response);
  }
})




router.post("/api/v1/testpanel/bulkupdate", (request, response) => {
  testpanel.testpanel.bulkTestUpdate(request, response)
})

router.get("/api/v1/testpanel/list/update", async function (req, res) {
  const { billingid } = req.query
  if (billingid) {
    try {
      const insertion = `SELECT * FROM test_panels AS tp  INNER JOIN
       test_ascension AS ta ON  ta.testid = tp.ID WHERE ta.billingid = ?`
      const result = await promisifyQuery(insertion, billingid)
      res.send({ message: "success", statusCode: 200, result })
    } catch (err) {
      logger.error(err)
    }
  } else {
    res.send({
      statusCode: 401,
      status: "billing id required",
      message: "include billing in the request header as a query",
    })
  }
})

router.post("/api/v1/testpanel/list", (req, res) => {
  testpanel.testpanel.postPanel(req, res)
})

router.put("/api/v1/testpanel/list", function (request, response) {
  testpanel.testpanel.putSingleTestPanel(request, response)
})

router.delete("/api/v1/testpanel/list", async (request, response) => {
  try {
    const { testid } = request.query
    if (!testid) return customError("testid is required", 404, res)
    const result = await testpanel.testpanel.deletePanel(testid)
    response.send({ status: result === true ? "success" : "failed" })
  } catch (err) {
    responseError(response)
  }
})

router.get("/api/v1/testpanel/list/customtestrule", async function (request, response) {
  try {
    const { testid } = request.query
    if (!testid) return customError("testid,testname,patientid and billingid are required", 404, response)
    const rule = await new Creator(testid).getTestCreationRule();
    response.send(rule);
  } catch (err) {
    responseError(response)
  }
})
router.get("/api/v1/testpanel/list/customtestrule/previous", async function (request, response) {
  try {
    const { csvid, ptid, testid, target = '70,50' } = request.query;
    if (!csvid || !ptid) return customError("required params are missing", 400, response)
    const rule = await new Creator(testid).getCustomPreviousRecords(csvid, ptid, target, testid);
    response.send(rule)
  } catch (err) {
    console.log(err)
    responseError(response)
  }
})

router.get("/api/v1/result/entry/record/collection", async function (request, response) {
  try {
    const { csvid, ptid, target = "70,50" } = request.query;
    if (!csvid || !ptid) return customError("right query params missing", 400, response);
    const outgoing_data = await new Creator().getResultEntryTest(csvid, ptid, target);
    response.send(outgoing_data)
  } catch (err) {
    responseError(response);
  }
})
router.get("/api/v1/testpanel/list/customtestrule/previous/comments", async function (request, response) {
  try {
    const { csvid, testid, ptid, target = '70,50' } = request.query
    if (!csvid || !testid) return customError("testid,testname,patientid and billingid are required", 404, response)
    const comments = await new Creator().getCustomCommentsRecords(csvid, ptid, target, testid)
    response.send({ comments })
  } catch (err) {
    responseError(response)
  }
})

router.put("/api/v1/testpanel/list/customtestrule", async function (request, response) {
  try {
    const { testid, data } = request.body
    if (!testid || !data)
      return customError("testid  && data is required", 404, response)
    if (data.length === 0)
      return customError("wrong format provided", 404, response)
    const updateRule = await new Creator(testid).updateTestCreationRule(data)
    response.send({ status: updateRule ? true : false })
  } catch (err) {
    responseError(response)
  }
})


router.put("/api/v1/testpanel/list/createcustom", async function (request, response) {
  try {
    const { name, testid } = request.body;
    if (!name || !testid || typeof testid != 'number' || typeof name != 'string') return customError("invalid request  body provided", 404, response);
    const isTestNameChanged = await testpanel.testpanel.changeTestName(testid, name)
    response.send({ status: isTestNameChanged ? "success" : "failed" });
  } catch (error) {
    console.log(error)
    responseError(response)
  }
})
module.exports = router


