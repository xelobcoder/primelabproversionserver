const router = require("express").Router()
const { customError, responseError, promisifyQuery } = require("../../../helper")
const logger = require("../../../logger")
const WareHouse = require("../../models/Inventory/warehouse")
const warehouse = new WareHouse()

router.post("/api/v1/inventory/warehouse", async function (request, response) {
	try {
		const { name } = request.body
		if (!name) {
			customError("include name of warehouse", 404, response)
			return
		}
		const result = await warehouse.addWareHouse(name)
		if (result === true) {
			response.send({
				message: "New warehouse added successuly",
				statusCode: 200,
				status: "success",
			})
		} else if (result === "EXIST") {
			customError("WareHouse already exist", 404, response)
			return
		} else {
			response.send({
				message: "Adding new warehouse failed",
				statusCode: 404,
				status: "error",
			})
		}
	} catch (err) {
		logger.error(err)
		customError("something wrong occured", 500, response)
	}
})

router.get("/api/v1/inventory/warehouse", async function (request, response) {
	try {
		const result = await warehouse.getAllWareHouse()
		response.send({ result, statusCode: 200, status: "success" })
	} catch (err) {
		logger.error(err)
		customError("something wrong occured", 500, response)
	}
})

router.put("/api/v1/inventory/warehouse", async function (request, response) {
	try {
		const { name, warehouseid } = request.body
		if (!name || !warehouseid) {
			customError("include name and id of warehouse", 400, response)
			return
		}
		const updated = await warehouse.updateWarehouse(warehouseid, name)
		response.send({
			message: updated ? "Warehouse updated successfully" : "Warehouse not updated,kindly check warehouse id provided",
			statusCode: updated ? 200 : 400,
			status: updated ? "success" : "error",
		})
	} catch (err) {
		logger.error(err)
		customError("something wrong occured", 500, response)
	}
})

// DELETE endpoint to delete a warehouse by ID
router.delete("/api/v1/inventory/warehouse/:id", async function (request, response) {
	try {
		const { id } = request.params
		if (!id) {
			customError("include id of warehouse", 400, response)
			return
		}
		const deleted = await warehouse.deleteWarehouse(id)
		if (!deleted) {
			response.send({
				message: "Warehouse not deleted",
				statusCode: 404,
				status: "error",
			})
			return
		}
		response.send({
			message: "Warehouse deleted successfully",
			statusCode: 200,
			status: "success",
		})
	} catch (err) {
		logger.error(err)
		customError("something wrong occured", 500, response)
	}
})

router.get("/api/v1/inventory/shelve", async function (request, response) {
	try {
		const { target } = request.query
		if (!target) {
			customError("target of query required", 404, response)
			return
		}
		if (target === "all") {
			const matched = await warehouse.getShelves()
			response.send({
				statusCode: 200,
				status: "success",
				result: matched,
			})
			return
		}
		const parsedString = parseInt(target)
		if (typeof parsedString === "number") {
			const matched = await warehouse.getShelf(target)
			response.send({
				statusCode: 200,
				result: matched,
				status: "success",
			})
			return
		}
		customError("wrong target type provided", 404, response)
	} catch (err) {
		logger.error(err)
		customError(err?.message, 500, response)
	}
})

router.post("/api/v1/inventory/shelve", async function (request, response) {
	try {
		const { warehouseId, name } = request.body
		if (!warehouseId || !name) {
			customError("WarehouseId or name not provided", 404, response)
			return
		}
		const result = await warehouse.createShelf(warehouseId, name)
		response.send({
			message: result ? "shelf created successfully" : "shelf creation failed",
			statusCode: 200,
			status: result ? "success" : "failed",
		})
	} catch (err) {
		logger.error(err)
		customError("something wrong occured", 500, response)
	}
})

router.get("/api/v1/inventory/warehouse/shelves", async function (request, response) {
	try {
		const { warehouseId } = request.query
		if (!warehouseId) {
			customError("WarehouseId", 404, response)
			return
		}
		const result = await warehouse.getWarehouseShelves(warehouseId)
		response.send({ statusCode: 200, status: "success", result })
	} catch (err) {
		logger.error(err)
		customError("something wrong occured", 500, response)
	}
})

router.get("/api/v1/inventory/warehouse/shelves/items", async function (request, response) {
	try {
		const { warehouseid, shelfid } = request.query
		if (!warehouseid || !shelfid) {
			customError("Warehouseid and shelfid are required", 404, response)
			return
		}
		const nwWarehouseid = parseInt(warehouseid)
		const nwShelfid = parseInt(shelfid)
		const result = await warehouse.getGeneralWareSelfItems(nwWarehouseid, nwShelfid)
		response.send({ statusCode: 200, status: "success", result })
	} catch (err) {
		logger.error(err)
		customError("something wrong occured", 500, response)
	}
})

router.post("/api/v1/inventory/settings", async (request, response) => {
	try {
		const { setting } = request.body
		if (!setting) return customError("settings body not added", 404, response)
		const isDbData = await promisifyQuery(`SELECT * FROM inventorycustomization`)
		const value = JSON.stringify(setting)
		if (isDbData.length === 0) {
			await promisifyQuery(`INSERT INTO inventorycustomization (settings) VALUE (?)`, [value])
			response.send({ status: "success" })
		} else {
			await promisifyQuery(`UPDATE inventorycustomization SET settings = ? WHERE id  = ?`, [value, isDbData[0]["id"]])
			response.send({ status: "success" })
		}
	} catch (err) {
		logger.error(err)
		responseError(response)
	}
})

router.get("/api/v1/inventory/settings", async function (request, response) {
	try {
		const data = await promisifyQuery(`SELECT * FROM inventorycustomization`)
		if (data.length > 0) {
			const { settings } = data[0]
			return response.send({
				result: JSON.parse(settings),
			})
		}
		response.send({ result: {} })
	} catch (err) {
		responseError(response)
	}
})
module.exports = router
