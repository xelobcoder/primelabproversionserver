const { response } = require("express")
const { customError, rowAffected } = require("../helper")
const Operations = require("../models/operations")

const router = require("express").Router()


router.get("/api/v1/operations/test", async (request, response) => {
  const { billingid } = request.query
  if (!billingid) {
    return customError("invalid billingid", 404, response)
  }
  const result = await new Operations(billingid).billingTest()
  if (result === "Billingid is not ready for testing") {
    return customError(result, 404, response)
  } else {
    response.send({ statusCode: 200, message: "success", result })
  }
})

// router.put("/api/v1/operations/test", async (req, res) => {
//   const { billingid, testid } = req.query
//   if (!billingid || !testid) {
//     return customError("billing id or testid is missing", 404, res)
//   }

//   const updatesProcessing = new Operations(billingid)
//   const result = await updatesProcessing.initiateStart(testid, billingid)

//   if (rowAffected(result)) {
//     res.send({ statusCode: 200, message: "success", result })
//   } else {
//     customError("failed to update", 400, res)
//   }
// })

module.exports = router
