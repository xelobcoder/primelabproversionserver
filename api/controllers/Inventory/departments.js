const { customError, responseError } = require("../../../helper")
const Departments = require("../../models/Departments/DepartmentClass")
const Requisition = require("../../models/Inventory/requisitionClass")
const WastageInventory = require("../../models/Inventory/wastageClass")
Requisition

const router = require("express").Router()

router.post("/api/v1/departments/requisitions", async function (request, response) {
  try {
    const result = await new Requisition().newDepartmentRequisition(request.body)
    response.send({ message: result, statusCode: 200, status: "success" })
  } catch (err) {
    err?.sqlMessage ? responseError(response) : customError(err, 404, response)
  }
})

router.get("/api/v1/departments/requisitions", async function (request, response) {
  try {
    const hasQuery = Object.keys(request.query)
    const requisition = new Requisition()
    if (hasQuery.length === 0) {
      const result = await requisition.getDepartmentsRequisitions()
      response.send({ result, statusCode: 200, status: "success" })
    } else if (hasQuery.includes("id") && hasQuery.includes("type")) {
      const { id, type } = request.query
      const result = await requisition.getDeptSpecificReqData(id, type)
      response.send({ result, statusCode: 200, status: "success" })
    } else {
      customError("valid request query params missing", 404, response)
    }
  } catch (err) {
    console.log(err)
    responseError(response)
  }
})

router.get("/api/v1/store/departments/requisitions/serve", async function (request, response) {
  try {
    const { departmentid } = request.query
    if (!departmentid) {
      customError("departmentid not provided", 404, response)
      return
    }
    const data = await new Departments().getDeptSpecificReqData(departmentid, "approved")
    response.send({ statusCode: 200, status: "success", result: data })
  } catch (err) {
    console.log(err)
    responseError(response)
  }
})

router.get("/api/v1/store/departments/requisitions/serve/supply", async function (request, response) {
  try {
    const { departmentid, stockid } = request.query
    if (!departmentid || !stockid) {
      customError("departmentid or stockid  not provided", 404, response)
      return
    }
    const data = await new Departments().StoreServeDeptReq(departmentid, stockid)
    response.send({ statusCode: 200, status: "success", result: data })
  } catch (err) {
    console.log(err)
    responseError(response)
  }
})

router.post("/api/v1/store/departments/requisitions/serve", async function (request, response) {
  try {
    const { data, qtyApproved, requisitionid, departmentid } = request.body
    if (!data || !qtyApproved || !requisitionid || !departmentid) {
      NotFound(response)
      return
    }
    if (!Array.isArray(data) || data.length === 0) {
      customError("data must be an array and must be greater than 0", 404, response)
      return
    }

    const result = await new Departments().serveApprovedReqt(data, qtyApproved, requisitionid, departmentid)

    switch (result) {
      case "PASSED":
        response.send({ status: "success" })
        break

      case "FAILED":
        response.send({ status: "failed", message: "stock not added to esrow. You might have omitted something" })
        break

      case "MISMATCH":
        response.send({ message: "qty approved and served qty do not match", status: "failed" })
        break

      case "ALREADY SUPPLIED":
        response.send({ message: "ALREADY SUPPLIED", status: "failed" })
        break

      default:
        response.send({ status: "pending" })
    }
  } catch (err) {
    console.log(err)
    logger.error(err)
    responseError(response)
  }
})

router.get("/api/v1/store/departments/requisitions", async function (request, response) {
  const hasQuery = Object.keys(request.query).length > 0
  if (!hasQuery) {
    getDepartmentsRequisitions(request, response)
  } else {
    const { id } = request.query
    if (!id) {
      customError("departmentid required in query", 404, response)
      return
    }
    const deptReq = await new Departments(id).getDeptSpecificReqData(id, "pending")
    if (deptReq) {
      response.send({ result: deptReq, statusCode: 200, status: "success" })
    }
  }
})

router.get("/api/v1/departments/requisitions/summary", async function (request, response) {
  try {
    const result = await new Departments().getPendingdepartmentReqSummary()
    response.send({ statusCode: 200, result, status: "success" })
  } catch (err) {
    responseError(response)
  }
})

router.get("/api/v1/departments/stocks", async function (request, response) {
  try {
    const { id } = request.query
    if (!id) return customError("departmentid required", 404, response)
    const result = await new Requisition().getDeptStocks(id)
    response.send({ status: "success", result, statusCode: 200 })
  } catch (err) {
    responseError(response)
  }
})

router.delete("/api/v1/departments/stocks", function (request, response) {
  const { id } = request.query
  deleteDeptStocks(request, response, id)
})

router.patch("/api/v1/departments/requisitions/stage1", async function (request, response) {
  try {
    const { status, quantity, requisitionid } = request.body
    const isUpdated = await new Departments().updateRequisitionApproval(quantity, requisitionid, status)
    response.send({ status: isUpdated ? "success" : "failed" })
  } catch (err) {
    console.log(err)
    customError(err, 404, response)
  }
})

router.patch("/api/v1/departments/requisitions/stage2", function (request, response) {
  const { id } = request.query
  patchRequisition(request, response, id)
})

router.put("/api/v1/departments/requisitions", async function (request, response) {
  const result = await new Departments().updateReqtAfterReceivedDept(request.body)
  response.send({ status: "success", message: result })
})

// consume
router.get("/api/v1/stock/department/consume/lot", async function (request, response) {
  try {
    const { stockid, departmentid } = request.query
    if (!stockid || !departmentid) {
      return customError("departmentid and stockid are required", 404, response)
    }
    const result = await new Departments().getDepartmentBrandBatch(stockid, departmentid)
    response.send({ result, statusCode: 200, status: "success" })
  } catch (err) {
    responseError(response)
  }
})

router.post("/api/v1/departments/stock/consume", async function (request, response) {
  try {
    const result = await new Requisition().consumeDepartmentStock(request.body)
    if (result === true) {
      response.send({ message: "stock successfully consumed", statusCode: 200, status: "success" })
    } else {
      response.send({ statusCode: 404, message: result, status: "warning" })
    }
  } catch (err) {
    responseError(response)
  }
})

router.get("/api/v1/inventory/departments/expiredproducts", async function (request, response) {
  try {
    const { departmentid } = request.query
    if (!departmentid) {
      return customError("departmentid required", 404, response)
    }
    const expiredproducts = await new Departments().getDepartmentExpired(departmentid)
    response.send({ status: "success", result: expiredproducts })
  } catch (err) {
    responseError(err)
  }
})

router.post("/api/v1/inventory/consume/department/expirestock", async function (request, response) {
  try {
    const disposeoff = await new WastageInventory().disposeoffDeptProduct(request.body)
    response.send({
      status: disposeoff == true ? "success" : "failed",
      statusCode: disposeoff == true ? 200 : 400,
      message: disposeoff === true ? "expired product disposed off successful" : "disposal failed",
    })
  } catch (err) {
    console.log(err)
    responseError(response)
  }
})

module.exports = router
