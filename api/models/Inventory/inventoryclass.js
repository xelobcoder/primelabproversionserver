const { rowAffected, paginationQuery, promisifyQuery, customError } = require("../../../helper")
const logger = require("../../../logger")
const database_queries = require("../../database/queries")
const NEWSTOCKQUERY = `INSERT INTO generalstocks (name,category,consumptionunit,purchaseunit,quantity,alertlevel,materialcode,warehouse,shelf) VALUES (?,?,?,?,?,?,?,?,?)`
const DELETESTOCKABRANDQUERY = "DELETE FROM stocksbrands WHERE stockid = ? && brandid = ?"
const GETGENERALSTOCK = ` SELECT 
                      ns.name as name,
                      ns.stockid as stockid,
                      sc.category as categoryname,
                      ns.consumptionunit as consumptionunit,
                      ns.purchaseunit as purchaseunit,
                      ns.quantity as quantity,
                      ns.date as date,
                      wc.id as warehouse,
                      sc.id as category,
                      sh.id as shelf,
                      ns.alertlevel as alertlevel,
                      ns.materialcode as materialcode
                      FROM generalstocks AS ns INNER JOIN stockcategory AS sc ON sc.id = ns.category
                      INNER JOIN warehouse AS wc ON ns.warehouse = wc.id
                      INNER JOIN shelves AS sh ON sh.id = ns.shelf`

const EXPIREDSTOCKSQUERY = `SELECT o.productordersid,s.brand, o.stockid, o.quantity, o.expirydate, o.received, o.receiveddate, o.expirydate, o.Batchnumber,s.brandid, o.name, o.suppliername, o.purchaseunit FROM orders AS o INNER JOIN stocksbrands AS s
ON o.brand = s.brandid
 WHERE o.RECEIVED = 'TRUE' AND DATE(o.expirydate) < CURRENT_DATE AND o.expiredDisposed IS NULL ORDER BY o.expirydate ASC LIMIT ? OFFSET ?`

const EXPIREDPRODUCTSMINI = `SELECT productordersid FROM orders WHERE RECEIVED = 'TRUE' AND DATE(expirydate) < DATE(NOW())`;

const GENERALUNEXPIREDSTOCKS = `SELECT * FROM generalstocks WHERE expirydate >= NOW() AND status = 'received' ORDER BY productordersid LIMIT ? OFFSET ?`

const UPDATEASTOCKQUERY = `UPDATE generalstocks SET  consumptionunit = ?,  purchaseunit = ?,  alertlevel = ?,  materialcode = ?,  date = ?,  name = ?,  category = ?,warehouse = ? , shelf = ? WHERE stockid = ?`

const DELETEASTOCKQUERY = `DELETE FROM newstock WHERE stockid = ?`

const FILTERSTOCKQUERY = `SELECT 
        gs.stockid,
        gs.name,
        gs.date,
        sc.category,
        gs.consumptionunit,
        gs.alertlevel,
        sc.category AS categoryname,
        gs.quantity
    FROM generalstocks AS gs
    INNER JOIN stockcategory AS  sc ON sc.id = gs.category
    WHERE gs.name  LIKE ? OR sc.category LIKE ? `

class Inventory {
  constructor(stockid) {
    this.stockid = stockid || null
  }

  /**
   * Checks if a stock with a given name exists in the `generalstocks` table of a database.
   *
   * @param {string} stockname - The name of the stock to check for existence.
   * @returns {boolean} - `true` if the stock exists, `false` if it does not exist.
   *
   * @example
   * const inventory = new Inventory();
   * const stockExists = await inventory.checkStockExist("exampleStockName");
   * console.log(stockExists); // true or false
   */
  async checkStockExist(stockname) {
    const item = await promisifyQuery(`SELECT * FROM generalstocks WHERE name = ?`, [stockname])
    return item.length > 0
  }

  async addNewStock(records) {
    const { name, category, consumptionunit, purchaseunit, quantity, alertlevel, materialcode, warehouse, shelf } = records
    if (await this.checkStockExist(name)) return "EXIST"

    if (!category || typeof category != "number" || !name) throw new Error("category of type number required and name required")
    const values = [name, category, consumptionunit, purchaseunit, quantity, alertlevel, materialcode, warehouse, shelf]

    const pushStock = await promisifyQuery(NEWSTOCKQUERY, values)
    return rowAffected(pushStock)
  }

  async updateAstock(records) {
    const { stockid, name, category, consumptionunit, purchaseunit, alertlevel, materialcode, warehouse, shelf, date } = records
    if (!stockid) throw new Error("stockid required")
    if (!category || typeof category != "number" || !(category > 0)) throw new Error("category must be a number greater than 0")
    const values = [consumptionunit, purchaseunit, alertlevel, materialcode, date, name, category, warehouse, shelf, stockid]
    const update = await promisifyQuery(UPDATEASTOCKQUERY, values)
    return rowAffected(update)
  }

  async deleteAstock(stockid) {
    if (!stockid || typeof stockid !== "number") throw new Error("stockid required")
    return await promisifyQuery(DELETEASTOCKQUERY, [parseInt(stockid)])
  }

  async getStocks(query, warehouseid) {
    let data = []
    let newQuery = GETGENERALSTOCK
    if (warehouseid && warehouseid != "all") {
      newQuery += ` WHERE ns.warehouse = ? LIMIT ? OFFSET ?`
      data = await paginationQuery(query, newQuery, [parseInt(warehouseid)])
      return data
    }
    newQuery += ` LIMIT ? OFFSET ?`
    return await paginationQuery(query, newQuery)
  }

  async getAstock(stockid) {
    if (!stockid) return
    return await promisifyQuery(`SELECT * FROM generalstocks WHERE stockid = ?`, [stockid])
  }

  async getMainSupplyStock(stockid, brandid) {
    if (!brandid || !stockid) return new Error("stockid and brandid required")
    return await promisifyQuery(`SELECT *  FROM mainstoresupply WHERE stockid = ? AND brandid  = ?`, [stockid, brandid])
  }

  async getExpiredStock(query) {
    return await paginationQuery(query, EXPIREDSTOCKSQUERY)
  }

  async addStockCategory(records) {
    const { category } = records
    if (!category || typeof category != "string") throw new Error("Must be of type string and category required")
    const stockAvailable = await promisifyQuery("SELECT * FROM stockcategory WHERE category = ?", [category])
    if (stockAvailable.length > 0) return 1
    const insertion = await promisifyQuery("INSERT INTO stockcategory (category) VALUE (?)", [category])
    return rowAffected(insertion)
  }

  async getStockCategory() {
    return await promisifyQuery(`SELECT * FROM stockcategory`)
  }

  async updateStockCategory(records) {
    const { id, category } = records
    if (!id || !category) throw new Error("category and id required")
    const stockAvailable = await promisifyQuery("SELECT * FROM stockcategory WHERE category = ?", [category])
    if (stockAvailable.length === 0) return 1
    const updateCat = await promisifyQuery("UPDATE stockcategory SET category = ? WHERE id = ?", [category, parseInt(id)])
    return rowAffected(updateCat)
  }

  async deleteStockCategory(stockid) {
    if (!stockid) throw new Error("stockid required")
    const isdeleted = await database_queries.del(stockid, "stockcategory", "id")
    return rowAffected(isdeleted)
  }

  async getGeneralUnExpiredStocks(requestQuery) {
    return await paginationQuery(requestQuery, GENERALUNEXPIREDSTOCKS)
  }

  async getGeneralExpired(query) {
    return await paginationQuery(query, EXPIREDSTOCKSQUERY)
  }

  async deleteStockBrand(records) {
    const { stockid, brandid } = records
    if (!stockid || !brandid) return "stockid and brandid are required"

    const deleteResult = await promisifyQuery(DELETESTOCKABRANDQUERY, [stockid, brandid])

    return rowAffected(deleteResult)
  }

  async getAstockBrands(records) {
    const { count, page, stockid } = records
    if (!stockid) throw new Error("stockid not provided")
    const result = await paginationQuery({ count, page }, `SELECT * FROM stocksbrands WHERE stockid = ? LIMIT ? OFFSET ?`, [stockid])
    return result
  }

  async addStockBrand(records) {
    const { brand, stockid } = records
    if (!brand || !stockid) throw new Error("brand name and stockid required")
    return rowAffected(await promisifyQuery(`INSERT INTO stocksbrands (brand,stockid) VALUES (?,?)`, [brand, stockid]))
  }

  async updateAStockBrand(records) {
    const { brand, stockid, brandid } = records
    if (!brand || !stockid || !brandid) {
      throw new Error("brand,brandid and stockid are all required")
    }
    const UPDATESTOCKBRANDQUERY = `UPDATE stocksbrands SET brand = ? WHERE stockid = ? AND brandid = ?`
    const isUpdated = await promisifyQuery(UPDATESTOCKBRANDQUERY, [brand, stockid, brandid])
    return rowAffected(isUpdated)
  }

  async filterstock(filteringValue, query) {
    let SQLQUERY = FILTERSTOCKQUERY
    if (!filteringValue)
      return []
    let values = [filteringValue, filteringValue]
    const { warehouseid } = query
    if (warehouseid && warehouseid != "all") {
      SQLQUERY += ` AND gs.warehouse = ?`
      values.push(parseInt(warehouseid))
    }
    SQLQUERY += ` ORDER BY gs.name LIMIT ? OFFSET ?`
    let data = await paginationQuery(query, SQLQUERY, values)
    if (data.length === 0)
      return data
    data = data.map((item, index) => {
      return { ...item, quantityrequired: 0 }
    })
    return data
  }

  async updateStockOrders(data) {
    const query = `UPDATE orders
              SET received = ?,
                  quantityReceived = ?,
                  receiveddate = ?,
                  status = ?,
                  expirydate = ?,
                  batchnumber = ?,
                  balance = ?,
                  brand = ? ,
                  price = ?,
                  totalamount = ? 
              WHERE productordersid = ?
              AND orderTransactionid = ? 
              AND stockid =?`
    return promisifyQuery(query, data)
  }

  async updateOrderReceivedTransactionSummary(summary) {
    const { orderTransactionid, method, amount, total } = summary
    if (parseFloat(amount) < 0 || parseFloat(total) < 0 || !orderTransactionid) return false
    const query = `UPDATE orderreceivedaccountsummary SET method  = ?,debit = ?, taxAmount = ?,updatedOn=NOW()  WHERE orderTransactionid = ?`
    const values = [method, total, amount, orderTransactionid]
    return await promisifyQuery(query, values)
  }

  async receivePurchaseStocks(records, total, tax, response) {
    try {
      if (records.length === 0) {
        if (response) {
          customError("data must contain an array of products", 500, response)
          return
        } else {
          throw new Error("data must be greater than 0")
        }
      }
      if (!tax || !Object.keys(tax).includes("amount") || !Object.keys(tax).includes("method")) {
        if (response) {
          return customError("Tax is an object with properties amount and method", 500, response)
        } else {
          throw new Error("Tax is an object with properties amount and method")
        }
      }
      const { orderTransactionid } = records[0]
      const requiredDataSource = records.map((item, index) => {
        const {
          productordersid,
          received,
          quantityReceived,
          receiveddate,
          status,
          expirydate,
          batchnumber,
          balance,
          brandid,
          price,
          totalamount,
          orderTransactionid,
          stockid,
        } = item

        return [
          received,
          quantityReceived,
          receiveddate,
          status,
          expirydate,
          batchnumber,
          balance,
          parseInt(brandid),
          parseFloat(price),
          parseFloat(totalamount),
          productordersid,
          orderTransactionid,
          stockid,
        ]
      })
      let successCount = 0
      let errorCount = 0
      let current = 0
      let ordersSummaryUpdated = false

      while (current < records.length) {
        const updateRecord = await this.updateStockOrders(requiredDataSource[current])
        rowAffected(updateRecord) ? successCount++ : errorCount++
        current++
      }
      if (successCount === records.length) {
        const summary = {
          orderTransactionid,
          total: parseFloat(total),
          method: tax?.method,
          amount: parseFloat(tax?.amount),
        }
        const updateSummary = await this.updateOrderReceivedTransactionSummary(summary)
        ordersSummaryUpdated = rowAffected(updateSummary)
      }
      return !response ?
        ordersSummaryUpdated :
        response.send({ message: "order updated successfully", statusCode: 200, status: "success" })
    } catch (err) {
      logger.error(err)
      throw new Error(err)
    }
  }
  async getDebitHxSingle(productordersid) {
    const DEBITHX = `SELECT * FROM  generalstoredebithx WHERE productordersid = ?`
    const queryValues = [productordersid]
    return await promisifyQuery(DEBITHX, queryValues)
  }

  async addDebitHx(productordersid, stockid, batchnumber, brandid, debitqty, wastage = 0) {
    if (!productordersid || !stockid || !batchnumber || !brandid) {
      throw new Error("brandid ,stockid ,batchnumber and productordersid are required")
    }
    const query = `INSERT INTO generalstoredebithx (productordersid,stockid,brandid,batchnumber,wastage,debitqty)
    VALUES(?,?,?,?,?,?)`

    return rowAffected(await promisifyQuery(query, [productordersid, stockid, brandid, batchnumber, wastage, debitqty]))
  }

  async getCreditHxSingle(productordersid, stockid, brandid, batchnumber) {
    const CREDITHX = `SELECT * FROM  generalstorecredithx WHERE productordersid = ? AND 
    stockid = ? AND brandid = ? AND batchnumber = ?`
    const queryValues = [productordersid, stockid, brandid, batchnumber]
    return await promisifyQuery(CREDITHX, queryValues)
  }

  async isDebitable(stockid, brands) {
    if (Array.isArray(brands) === false || brands.length === 0) {
      throw TypeError("Array required and must not be empty")
    }
    const list = brands.join(",")
    // BUG ----
    const QUERY = `SELECT DISTINCT
              chx.credit,
              chx.id AS creditid,
              chx.productordersid,
              chx.stockid,
              chx.brandid,
              chx.batchnumber,
              stb.brand,
              dhx.debitqty
      FROM  generalstoredebithx AS dhx INNER JOIN generalstorecredithx
      AS chx ON chx.productordersid = dhx.productordersid
      INNER JOIN stocksbrands AS stb ON stb.brandid = chx.brandid
      WHERE chx.stockid = ?  AND dhx.wastage = 0 AND  chx.brandid IN (${list}) GROUP BY chx.productordersid, chx.batchnumber,chx.brandid ,chx.stockid`
    let data = await promisifyQuery(QUERY, [stockid])

    data = data
      .map((item, index) => {
        const storeQty = parseInt(item.credit) - parseInt(item.debitqty)
        return { ...item, storeQty }
      })
      .filter((a, b) => a["storeQty"] > 0)
    return data
  }

  async purchasetoConsumeInsight(data) {
    const { stockid, records } = data
    if (!stockid || !records)
      throw new Error("stockid and records are required");
    const ORDERHX = `SELECT 
                  date as orderdate,
                  productordersid,
                  receiveddate,
                  batchnumber,
                  brand,
                  stockid,
    DATEDIFF(date,receiveddate) as pt_to_grn FROM orders WHERE stockid = ? 
    AND received = 'TRUE' ORDER BY productordersid DESC LIMIT ?`
    const getStockOrdersHx = await promisifyQuery(ORDERHX, [stockid, records]);
    let result = []
    if (getStockOrdersHx.length > 0) {
      result = await Promise.all(
        getStockOrdersHx.map(async (transaction, i) => {
          const { batchnumber, brand, stockid, productordersid } = transaction
          const getCreditHx = await this.getCreditHxSingle(productordersid, stockid, brand, batchnumber)
          const getDebitHx = await this.getDebitHxSingle(productordersid, stockid, brand, batchnumber)
          transaction.credithistory = getCreditHx
          transaction.debithistory = getDebitHx
          return transaction
        })
      )
    }
    return result
  }

  async updateGeneralStocksQty(qty, stockid, operation = "minus") {
    if (!qty || !stockid) return new Error("qty and stockid are all required");
    if (qty < 0) return new Error("qty must be greater than 0")
    const stockinfo = await this.getAstock(stockid)
    if (stockinfo.length === 0) return "Not Found"
    const quantity = parseInt(stockinfo[0]["quantity"])
    const newQty = operation === "add" ? quantity + qty : quantity - qty
    const update = await promisifyQuery(`UPDATE generalstocks SET quantity = ? WHERE stockid = ?`, [newQty, stockid])
    return rowAffected(update);
  }

  async updateMainSupplyGeneral(stockid, brandid, qty, operation) {
    if (!stockid || !brandid || !qty) {
      throw new Error("stockid ,qty and brandid are required")
    }
    const info = await this.getMainSupplyStock(stockid, brandid)
    if (info.length === 0) return null
    const infoqty = parseInt(info[0]["quantity"]);
    const newQty = operation === "add" ? infoqty + qty : infoqty - qty
    const update = await promisifyQuery(
      `UPDATE mainstoresupply SET quantity = ? WHERE stockid = ?
    AND brandid = ?`,
      [newQty, stockid, brandid]
    );
    return rowAffected(update);
  }
}

module.exports = Inventory

