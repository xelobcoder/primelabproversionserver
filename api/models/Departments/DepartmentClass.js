const { promisifyQuery, rowAffected, retryableTransaction } = require("../../../helper")
const logger = require("../../../logger")
const database_queries = require("../../database/queries")
const Escrow = require("../Inventory/esrow")
const Inventory = require("./../Inventory/inventoryclass")

class Departments {
  constructor(departmentid) {
    this.departmentid = departmentid
  }

  async getPendingdepartmentReqSummary() {
    let query = `SELECT COUNT(hx.id) AS pending,hx.departmentid,d.department
    FROM departmentrequisition AS hx INNER JOIN departments AS d ON hx.departmentid = d.id WHERE quantity_approved IS NULL`
    if (this.departmentid) {
      query += ` AND departmentid = ?`
    }
    query += ` GROUP BY hx.departmentid`
    return await promisifyQuery(query, [this.departmentid])
  }

  async getDeptSpecificReqData(id, type) {
    try {
      // join department requisition table with  name of department  table and name of newstock table
      if (!id) return new Error("id required")

      let mysql_query = `SELECT  drh.id,
                        drh.departmentid, 
                        drh.stockid, 
                        drh.quantity_requested,
                        drh.quantity_approved,
                        drh.status,
                        drh.date,
                        drh.comsumptionunit,
                        d.department,ns.stockid,
                        ns.name,
                        ns.quantity
                        FROM departmentrequisition AS drh
              INNER JOIN departments AS d ON d.id = drh.departmentid
              INNER JOIN generalstocks AS ns ON ns.stockid = drh.stockid`

      if (type === "pending") {
        mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NULL AND store_supplied = 0 `
      }

      if (type === "approved") {
        mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NOT NULL AND status = 'approved' AND store_supplied = 0`
      }

      if (type === "rejected") {
        mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NOT NULL AND status = 'rejected'`
      }

      if (type === "received") {
        mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NOT NULL AND status = 'received'`
      }

      if (type === "receiving") {
        mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NOT NULL AND status = 'approved' AND store_supplied = 1`
      }

      return promisifyQuery(mysql_query, [parseInt(id)])
    } catch (err) {
      logger.error(err)
      throw new Error(err)
    }
  }

  async StoreServeDeptReq(departmentid, stockid) {
    if (!departmentid || !stockid) throw new Error("Departmentid and stockid Required")

    const inventory = new Inventory()

    const brands = await inventory.getAstockBrands({ stockid })

    const stocksbrands = brands.map((a, i) => a.brandid)

    if (stocksbrands.length === 0) return []

    let product = await promisifyQuery(
      `SELECT * FROM mainstoresupply AS ms INNER JOIN stocksbrands AS sb ON sb.brandid =  ms.brandid
      WHERE ms.brandid IN (${
        stocksbrands.length === 1 ? stocksbrands[0] : Array.prototype.toString.call(stocksbrands)
      }) AND ms.stockid = ?`,
      [stockid]
    )

    product = product.map((item, index) => {
      return { ...item, storeQty: item?.quantity }
    })
    return product
  }

  async checkStoreSuppliedAlready(requisitionid) {
    if (!requisitionid) throw new Error("requisition id is required")

    const CHECKQUERY = `SELECT store_supplied FROM departmentrequisition WHERE id = ?`

    const row = await promisifyQuery(CHECKQUERY, [requisitionid])

    return row[0]["store_supplied"] == 1
  }

  async addNewDeptRequisionhx(records) {
    const { productordersid, stockid, brandid, batchnumber, served, type, requisitionid, departmentid } = records
    const query = ` INSERT INTO departmentrequisitionhx (productordersid, stockid, brandid, batchnumber, qty, requisitionid,departmentid,status)
    VALUES (?, ?, ?, ?, ?,?,?,?)`

    const values = [productordersid, stockid, brandid, batchnumber, served, requisitionid, departmentid, "received"]

    return rowAffected(await promisifyQuery(query, values))
  }
  async addProductEscrow(productordersid, stockid, brandid, batchnumber, qty, type, requisitionid, departmentid) {
    const newEscrowQuery = `
      INSERT INTO stocksEsrow (productordersid, stockid, brandid, batchnumber, qty, type,requisitionid,departmentid)
      VALUES (?, ?, ?, ?, ?, ?,?,?)
    `

    return await promisifyQuery(newEscrowQuery, [productordersid, stockid, brandid, batchnumber, qty, type, requisitionid, departmentid])
  }

  async checkEscrowOrderExists(productordersid, stockid, brandid, batchnumber) {
    const checkEscrowQuery = `
      SELECT COUNT(*) as count
      FROM stocksEsrow
      WHERE productordersid = ? AND stockid = ? AND brandid = ? AND batchnumber = ?
    `

    const result = await promisifyQuery(checkEscrowQuery, [productordersid, stockid, brandid, batchnumber])
    const orderCount = result[0].count

    return orderCount > 0
  }

  async serveApprovedReqt(data, approvedQty, requisitionid, departmentid) {
    try {
      if (!Array.isArray(data) || approvedQty < 0 || !requisitionid || !departmentid) {
        throw new Error("Invalid data provided")
      }

      const totalServed = data.reduce((acc, item) => acc + item.served, 0)
      if (totalServed !== approvedQty) {
        return "MISMATCH"
      }

      if (await this.checkStoreSuppliedAlready(requisitionid)) return "ALREADY SUPPLIED"
      const filterData = data.filter((item) => item.served > 0)

      const updated = await this.updateDeptReqtAfterSupplied(1, requisitionid)
      if (updated) {
        const results = await Promise.all(
          filterData.map(async (item, index) => {
            const { productordersid, stockid, brandid, batchnumber, served, type = "debit" } = item;
            
            const outcome = await this.addProductEscrow(
              productordersid,
              stockid,
              brandid,
              batchnumber,
              served,
              type,
              requisitionid,
              departmentid
            )
            return rowAffected(outcome)
          })
        )
        const passedCount = results.filter((value) => value === true).length
        return passedCount === filterData.length ? "PASSED" : "FAILED"
      } else {
        await this.updateDeptReqtAfterSupplied(0, requisitionid)
        return "FAILED"
      }
    } catch (err) {
      await this.updateDeptReqtAfterSupplied(0, requisitionid)
      await promisifyQuery(`DELETE  FROM stocksesrow WHERE requisitionid = ?`, [requisitionid])
      logger.error(err)
      throw new Error(err)
    }
  }

  async updateRequisitionApproval(quantity, requisitionid, status) {
    if (!requisitionid || !status) throw new Error("requisitionid && status is required")
    const qty = parseInt(quantity)
    if (isNaN(requisitionid) || isNaN(qty)) throw new Error("valid integers required")

    if (qty < 0) return false
    const query = `UPDATE departmentrequisition SET quantity_approved = ?,status = ?, approvedOn = NOW() WHERE  id = ?`
    const result = await promisifyQuery(query, [quantity, status, requisitionid])
    return rowAffected(result)
  }

  async updateDeptReqtAfterSupplied(store_supplied, requisitionid) {
    if (typeof store_supplied == "string") {
      throw TypeError("store_supplied must be a number")
    }

    if (store_supplied < 0 || !requisitionid)
      throw new Error("int store_supplied and requisitionid  required")

    const mysql_query = `UPDATE departmentrequisition SET
                store_supplied = ?
                WHERE id = ?`

    const values = [store_supplied, parseInt(requisitionid)]

    return rowAffected(await promisifyQuery(mysql_query, values))
  }

  async updateQtyDeptReceived(quantityReceived, departmentReceived, status, employeeid, requisitionid) {
    const update_query = `UPDATE departmentrequisition 
       SET quantityReceived = ?, departmentReceived = ?, 
       status = ?, receivingemployee = ? WHERE id = ?`

    const values = [quantityReceived, departmentReceived, status, employeeid, requisitionid]

    return rowAffected(await promisifyQuery(update_query, values))
  }

  async isDeptHaveStockBrand(stockid, brandid, batchnumber) {
    const count = await promisifyQuery(`SELECT * FROM departmentsmainsupply WHERE stockid = ? AND brand = ? AND batchnumber = ? LIMIT 1`, [
      stockid,
      brandid,
      batchnumber,
    ])

    return count.length > 0
  }
  async getDeptHaveStockBrand(stockid, brandid, batchnumber, LIMIT) {
    const count = await promisifyQuery(`SELECT * FROM departmentsmainsupply WHERE stockid = ? AND brand = ? AND batchnumber = ? LIMIT ?`, [
      stockid,
      brandid,
      batchnumber,
      LIMIT,
    ])

    return count
  }

  async insertDeptMainStockSupply(records) {
    const { qty, stockid, brandid, batchnumber, departmentid } = records
    const query = `INSERT INTO departmentsmainsupply (quantity,
      stockid,brand,batchnumber,departmentid) VALUES(quantity,stockid,brand,batchnumber,departmentid)`

    return rowAffected(await promisifyQuery(query, [qty, stockid, brandid, batchnumber, departmentid]))
  }

  async updateDepartmentMainStocks(records, arithmetric = "add") {
    const { stockid, brandid, batchnumber, qty } = records

    if (await this.isDeptHaveStockBrand(stockid, brandid, batchnumber)) {
      const info = await this.getDeptHaveStockBrand(stockid, brandid, batchnumber, 1)
      const current_qty = info[0]["quantity"]
      const updated_qty = arithmetric === "add" ? parseInt(current_qty) + parseInt(qty) : parseInt(current_qty) - parseInt(qty)
      return await promisifyQuery(
        `UPDATE departmentsmainsupply SET 
      quantity = ? WHERE stockid = ? AND  brand = ? AND batchnumber = ?`,
        [updated_qty, stockid, brandid, batchnumber]
      )
    } else {
      await this.insertDeptMainStockSupply(records)
    }
  }

  async updateReqtAfterReceivedDept(records) {
    const { quantityReceived, departmentReceived, id, status, employeeid, departmentid, stockid } = records

    if (!quantityReceived || !departmentReceived || !id || !employeeid || !departmentid) {
      throw new Error("quantityReceived, departmentReceived, requisitionid, departmentid status and employee id required")
    }

    let esrow = new Escrow(id)

    let esrowItems = await esrow.getEsrowReqt()

    if (esrowItems.length <= 0) {
      await database_queries.del(id, "departmentrequisition", "id")
      return "NO ITEM IN ESCROW"
    }

    function isToday(dateString) {
      const today = new Date()
      const itemDate = new Date(dateString)
      return (
        itemDate.getDate() === today.getDate() && itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear()
      )
    }
    // check validity of esrow, must be pending and the addedon must be equal to today
    // Filter esrowItems based on the condition
    esrowItems = esrowItems.filter((item) => item?.status === "pending" && isToday(item?.addedon))
    // Check if there are any items left, if empty, meaning escrow time elapsed, we delete the requisition
    //  and allow for new requisiitons to be made
    if (esrowItems.length === 0) {
      esrow.updateEscrow(id, "canceled")
      // delete requisition
      await database_queries.del(id, "departmentrequisition", "id")
      return "EXPIRED ESROW TIME, REQUEST AGAIN"
    }

    try {
      await this.updateQtyDeptReceived(quantityReceived, departmentReceived, status, employeeid, id)
      await esrow.updateEscrow(id, "received")
      // ---NOTE-- functions below have been implemented with triggers to avoid lock deadlock issues with transactions
      // await this.updateDepartmentMainStocks(item)
      // await wastage.updateMainSupplyGeneral(stockid, brandid, qty, "minus")
      // await wastage.updateGeneralStocksQty(qty, stockid);
      return "UPDATE SUCCESSFUL"
    } catch (error) {
      logger.error(error)
      throw new Error(error)
    }
  }

  async getDepartmentBrandBatch(stockid, departmentid) {
    try {
      if (!stockid || !departmentid) {
        throw new Error("stockid and departmentid are required")
      }
      const queryString = `SELECT id,
              bt.batchnumber,
              bb.brand,
              bb.brandid,
              bt.departmentid,
              bt.quantity
      FROM departmentsmainsupply AS bt INNER JOIN stocksbrands AS bb ON bb.brandid = bt.brand
      WHERE bt.stockid = ? AND bt.departmentid = ?`
      const values = [stockid, departmentid]

      let result = await promisifyQuery(queryString, values)
      return result
    } catch (err) {
      throw new Error(err)
    }
  }

  async getDepartmentExpired(departmentid) {
    if (!departmentid) throw new Error("departmentid is required")
    const query = `
              SELECT 
              dm.stockid,
              sc.brand,
              dm.brand AS brandid,
              dm.quantity AS qtyAvailable,
              dm.batchnumber,
              gs.name,
              od.expirydate
          FROM 
              departmentsmainsupply AS dm
          INNER JOIN 
              orders AS od ON dm.stockid = od.stockid
          INNER JOIN 
              stocksbrands AS sc ON sc.brandid = dm.brand
          INNER JOIN 
              generalstocks AS gs ON gs.stockid = dm.stockid
          WHERE 
              od.stockid = dm.stockid 
              AND dm.batchnumber = od.batchnumber 
              AND dm.brand = od.brand 
              AND dm.expiredDisposed = 0 
              AND DATE(od.expirydate) < CURRENT_DATE
              AND dm.departmentid = ?
          GROUP BY 
    dm.batchnumber, dm.brand, dm.stockid, dm.quantity, gs.name, od.expirydate
`
    const result = await promisifyQuery(query, [departmentid,departmentid])
    return result
  }
}

module.exports = Departments

// new Departments().getDepartmentExpired(8)
