const router = require("express").Router();
const { customError, responseError } = require("../../../helper")
const logger = require("../../../logger")
const Inventoryanalytics = require("../../models/Inventory/inventoryAnalytics")
const Inventory = require("../../models/Inventory/inventoryclass")
const WastageInventory = require("../../models/Inventory/wastageClass")
const wastage = new WastageInventory()
const inventory = new Inventory()
const urgentActions = require('../../models/Inventory/urgentActions');
const redisClient = require('../../models/redisclient');

 


router.put("/api/v1/stock", async function (request, response) {
  try {
    const result = await inventory.updateAstock(request.body)
    if (result === true) {
      response.send({ message: "updated successfully", statusCode: 200, status: "success" })
    } else {
      response.send({ message: "stock not updated", statusCode: 404, status: "error" })
    }
  } catch (err) {
    customError("something went wrong", 500, response)
  }
})

router.post("/api/v1/stock/category", async function (request, response) {
  try {
    const newStkCat = await inventory.addStockCategory(request.body)
    if (newStkCat === true) {
      response.send({ message: "stock category successfully added", statusCode: 200, status: "success" })
    } else if (newStkCat === 1) {
      response.send({ message: "stock category already exist", statusCode: 200, status: "success" })
    } else {
      response.send({ message: "stock category not added", statusCode: 400, status: "error" })
    }
  } catch (err) {
    customError(err?.sqlMessage ? "something wrong occured" : err, err?.sqlMessage ? 500 : 404, response)
    logger.error(err)
  }
})

router.put("/api/v1/stock/category", async function (request, response) {
  try {
    const updateStkCat = await inventory.updateStockCategory(request.body);
    if (updateStkCat === true) {
      return response.send({ message: "updated successfully", statusCode: 200, status: "success" })
    } else if (updateStkCat === 1) {
      return customError("stock category not found", 404, response)
    } else if (updateStkCat === false) {
      return response.send({ message: "updated failed" })
    } else {
      return;
    }
  } catch (err) {
    customError("somthing went wrong", 404, response)
    logger.error(err)
  }
})
router.get("/api/v1/stock/category", async function (request, response) {
  try {
    data = await inventory.getStockCategory();
    response.send({ result: data, status: "success", statusCode: 200 })
  } catch (err) {
    logger.error(err);
    customError("something went wrong", 500, response)
  }
})

router.delete("/api/v1/stock/category", async function (request, response) {
  try {
    const { id } = request.body
    if (!id) {
      customError("category id not included in body", 404, response)
    } else {
      const deleteStock = await inventory.deleteStockCategory(id)
      response.send({
        message: deleteStock === true ? "category deleted successfully" : "Category not deleted",
        statusCode: deleteStock === true ? 200 : 404,
        status: deleteStock ? "success" : "error",
      })
    }
  } catch (err) {
    console.log(err)
    customError(err, 500, response)
  }
})

router.delete("/api/v1/stock", function (request, response) {
  deleteAstock(request, response)
})

router.post("/api/v1/stock", async function (request, response) {
  try {
    const outcome = await inventory.addNewStock(request.body)
    if (outcome === "EXIST") {
      customError("stock already exist", 404, response)
      return
    }
    if (outcome === false) {
      customError("New stock addition failed", 500, response)
      return
    }
    response.send({ message: "New stock successfully added", status: "success", statusCode: 200 })
  } catch (err) {
    customError("something wrong occured", 500, response)
  }
})

router.get("/api/v1/stocks/filter", async function (request, response) {
  const { filter } = request.query
  if (!filter) customError(`filter not included in the request query`, 404, response)
  else {
    const result = await inventory.filterstock(`%${filter}%`.trim(), request.query)
    response.send({ result, statusCode: 200, status: "success" })
  }
})

router.get("/api/v1/stock", async function (request, response) {
  try {
    const { page, count, warehouseid } = request.query
    const result = await inventory.getStocks({ page, count }, warehouseid)
    response.send({ result, statusCode: 200, status: "success" })
  } catch (err) {
    logger.error(err)
    customError("something wrong occured", 500, response)
  }
})

router.get("/api/v1/stock/expirestocks", async function (request, response) {
  try {
    const expireStocks = await inventory.getGeneralExpired(request.query)
    response.send({ statusCode: 200, status: "success", result: expireStocks })
  } catch (err) {
    console.log(err)
    customError("something wrong occured", 500, response)
  }
})

router.post("/api/v1/consume/expirestock", async function (request, response) {
  try {
    const { productordersid, stockid, brandid, batchnumber } = request.body;
    if (productordersid && stockid && brandid && batchnumber) {
      const isDispose = await wastage.disposeoffExpireProduct(request.body)
      if (isDispose === true) {
        response.send({
          message: "stock successfully disposed as wastage",
          statusCode: 200, status: "success"
        })
      } else if (isDispose === "EXIST") {
        response.send({
          message: "stock was already successfully disposed as wastage",
          statusCode: 200, status: "success"
        })
      } else {
        customError("something wrong occured or the right data not provided", 404, response)
      }
    } else {
      customError("include productordersid ,stockid, brandid,batchnumber", 404, response)
    }
  } catch (err) {
    responseError(response)
  }
})

router.get("/api/v1/inventory/analytics/urgentactions", async function (request, response) {
  try {
    const { action } = request.query
    urgentActions(action, response)
  } catch (err) {
    logger.error(err)
  }
})

router.get("/api/v1/inventory/analytics/summary", async function (request, response) {
  try {
    const analy = new Inventoryanalytics()

    const summary = {
      ...(await analy.getInvSummaryAnalytics()),
      incompleteOrders: await analy.getIncompOrdersCount(true),
      completedOrdersCount: await analy.completeOrdersCount(true),
    }
    response.send({ status: "success", result: summary })
  } catch (err) {
    responseError(response)
  }
})

router.delete('/api/v1/stock/brands', async function (request, response) {
  try {
    const isdeleted = await inventory.deleteStockBrand(request.body);
    if (isdeleted === true) {
      response.send({message: 'brand successfully deleted', statusCode: 200, status: "success" });
    } else if (isdeleted === false) {
      customError('deleting brand failed', 404, response);
    } else {
      customError('stockid and brandid are required', 404, response);
    }
  } catch (err) {
    logger.error(err)
    customError('something went wrong', 500, response);
 }
})
router.get('/api/v1/stock/brands', async function (request, response) {
  try {
    const result = await inventory.getAstockBrands(request.query)
    response.send({ statusCode: 200, status: 'success', result });
  } catch (err) {
    logger.error(err);
    customError("something wrong occured", 500, response);
 }
})

router.put('/api/v1/stock/brands', async function (request, response) {
  try {
    const isUpdated = await inventory.updateAStockBrand(request.body);
    if (isUpdated) {
      response.send({ message: 'brand updated successfully', statusCode: 200, status: "success" });
    } else {
      customError('updating brand failed', 404, response);
    }
  } catch (err) {
    logger.error(err);
    customError("something wrong occured", 500, response);
 }
})

router.post('/api/v1/stock/brands', async function (request, response) {
  try {
    const addBrand = await inventory.addStockBrand(request.body);
    if (addBrand) {
      response.send({ message: 'brand added successfully', statusCode: 200, status: "success" });
    } else {
      logger.error(err);
      customError('adding brand failed', 404, response);
    }
  } catch (err) {
    logger.error(err);
    customError("something wrong occured", 500, response);
 }
})


router.post('/api/v1/inventory/analytics/purchasetoconsume', async function (request, response) {
  const result = await inventory.purchasetoConsumeInsight(request.body);
  response.send(result);
})

module.exports = router;

