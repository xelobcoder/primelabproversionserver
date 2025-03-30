const router = require("express").Router()
const { responseError, customError } = require("../../../helper")
const Inventoryanalytics = require("../../models/Inventory/inventoryAnalytics")
const WastageInventory = require("../../models/Inventory/wastageClass")

const analytics = new Inventoryanalytics()
const wastage = new WastageInventory()

const baseurl = `/api/v1/`

router.get(`${baseurl}inventory/wastages/summary`, async function (request, response) {
  try {
    const { departmentid } = request.query
    if (departmentid) {
      const result = await analytics.getDepartmentWastageByQuartersSummary(departmentid)
      return response.send({ status: "success", result })
    } else {
      const result = await analytics.getWastagePerQuarters()
      response.send({ status: "success", result })
    }
  } catch (err) {
    responseError(response)
  }
})

router.get(`${baseurl}inventory/wastages/data/quarters`, async function (request, response) {
  try {
    const { quarters, count, page, departmentid = null } = request.query

    if (!quarters) {
      customError("quarters,page and count required", 404, response)
    }
    if (departmentid) {
      const result = await wastage.getDeptQuarterlyWastageData(quarters, departmentid, count, page)
      response.send({ result, status: "success" })
    } else {
      const result = await wastage.getQuarterlyData(quarters, count, page, departmentid)
      response.send({ result, status: "success" })
    }
  } catch (err) {
    console.log(err)
    responseError(response)
  }
})

router.get(`${baseurl}inventory/wastages/data/quarters/summary`, async function (request, response) {
  try {
    const { quarters, departmentid } = request.query

    if (!quarters) {
      customError("quarters required", 404, response)
    }

    if (departmentid) {
      const result = await wastage.getDeptMonthlySummaryWastages(quarters, departmentid)
      response.send({ result, status: "success" })
    } else {
      const result = await wastage.getMonthlySummaryByQuarters(quarters)
      response.send({ result, status: "success" })
    }
  } catch (err) {
    console.log(err)
    responseError(response)
  }
})

module.exports = router
