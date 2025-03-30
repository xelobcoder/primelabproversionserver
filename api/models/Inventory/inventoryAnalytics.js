const { promisifyQuery, paginationQuery } = require("../../../helper")
const logger = require("../../../logger")
const Departments = require("../Departments/DepartmentClass");
const Inventory = require("./inventoryclass");
const WastageInventory = require("./wastageClass");

class Inventoryanalytics {
  constructor(stockid, departmentid) {
    this.stockid = stockid
    this.departmentid = departmentid
  }

  async getCustomizationData() {
    return await promisifyQuery(`SELECT * FROM inventorycustomization`)
  }

  parseJsonData(data) {
    if (data === "{}" || data === null || data === undefined) return false
    return JSON.parse(data)
  }

  async customization() {
    const unparsed = await this.getCustomizationData()
    if (unparsed.length === 0) return
    const { settings } = unparsed[0]
    return this.parseJsonData(settings)
  }

  async getNearExpiry(count = true) {
    const data = await this.customization()
    const nearExpiry = parseInt(data?.expirydays) + 1 || 22
    const query = `SELECT DISTINCT ${count
        ? "COUNT(*) AS count"
        : "productordersid, name,receiveddate,expirydate,quantityReceived,expiredDisposed,batchnumber,brand,stockid"
      } FROM  orders AS o WHERE o.status = 'received' AND DATEDIFF(o.expirydate, CURRENT_DATE()) < ?  AND 
    DATE(CURRENT_DATE ) < DATE(o.expirydate)`;

    const rowsCount = await promisifyQuery(query, nearExpiry)
    if (count) {
      return rowsCount.length > 0 ? rowsCount[0]["count"] : 0
    }
    return rowsCount
  }

  async getBelowAlert(count = true) {
    const query = `SELECT ${count ? "COUNT(*) AS count" : "*"} FROM generalStocks where quantity < alertlevel`
    const data = await promisifyQuery(query)
    if (count) {
      return data.length > 0 ? data[0]["count"] : 0
    }
    return data
  }

  async getExpiredCount(count = true) {
    const query = `SELECT ${count ? "COUNT(*) AS count" : "*"} FROM orders WHERE RECEIVED = 'TRUE'
    AND status = 'received' AND DATE(expirydate) < CURRENT_DATE`
    const data = await promisifyQuery(query)
    if (count) return data.length > 0 ? data[0]["count"] : 0
    return data
  }

  async getInvSummaryAnalytics() {
    const data = await promisifyQuery(`SELECT * FROM inventoryanalyticssummary`)
    return data.length > 0 ? this.parseJsonData(data[0]["settings"]) : {}
  }

  async getIncompOrdersCount(count) {
    try {
      const query = `SELECT ${count === true ? "COUNT(*) AS count" : "*"} FROM orders WHERE received  = 'FALSE'`
      const result = await promisifyQuery(query)
      if (count === true) {
        return result.length > 0 ? result[0]["count"] : null
      }
      return result
    } catch (err) {
      throw new Error(err)
    }
  }

  async completeOrdersCount(count, t = { page: 1, count: 10 }) {
    try {
      let query = `SELECT  ${count === true ? "COUNT(*) AS count" : "*"} FROM orders WHERE received = 'TRUE'`
      if (count === true) {
        const result = await promisifyQuery(query)
        return result.length > 0 ? result[0]["count"] : 0
      }
      query += ` LIMIT ? OFFSET ?`
      const result = await paginationQuery(t, query)
      return result
    } catch (err) {
      logger.error(err)
      throw new Error(err)
    }
  }

  async updateInvenAnalSummary() {
    const updateQ = `UPDATE inventoryanalyticssummary SET settings = ? WHERE id  = 1`
    const insertQ = `INSERT INTO inventoryanalyticssummary (settings) VALUES (?)`
    try {
      const n = await this.getNearExpiry()
      const e = await this.getExpiredCount()
      const b = await this.getBelowAlert()
      const getSettings = await promisifyQuery(`SELECT * FROM inventoryanalyticssummary`)
      const data = JSON.stringify({ nearExpiryCount: n, belowAlertLevel: b, expiredCount: e })
      const isAvail = getSettings.length > 0
      if (isAvail) {
        await promisifyQuery(updateQ, [data])
      } else {
        await promisifyQuery(insertQ, [data])
      }
    } catch (err) {
      logger.error(err)
      throw new Error(err)
    }
  }

  async quartersReducer(result) {
    if (!result || !Array.isArray(result)) return null
    const reducer = (data) => data.reduce((sum, current) => sum + current?.debitAmount, 0);
    const totalWastage = reducer(result)
    const firstQ = reducer(result.filter((a, b) => a.quarter === 1))
    const secondQ = reducer(result.filter((a, b) => a.quarter === 2))
    const thirdQ = reducer(result.filter((a, b) => a.quarter === 3))
    return {
      firstQ,
      secondQ,
      thirdQ,
      totalWastage,
    }
  }

  async getWastagePerQuarters() {
    let query = `SELECT dhx.productordersid,
    CASE
       WHEN o.pricing = 'unit' THEN (dhx.debitqty * o.price)
       WHEN o.pricing = 'absolute' THEN (dhx.debitqty + o.price) 
    END AS debitAmount,
    CASE
       WHEN MONTH(dhx.debitdate)  BETWEEN 1 AND 4 THEN 1
       WHEN MONTH (dhx.debitdate) BETWEEN 5 AND 8 THEN 2
       WHEN MONTH (dhx.debitdate) BETWEEN 5 AND 8 THEN 3
    END AS quarter,
            o.pricing,
            o.quantityReceived,
            o.price,
            o.totalamount,
            dhx.wastage,
            dhx.debitqty,
            dhx.departmentid
     FROM generalstoredebithx AS dhx INNER JOIN  orders AS o
     ON o.productordersid = dhx.productordersid WHERE dhx.wastage = 1`
    let result = await promisifyQuery(query)
    if (result.length === 0) return result
    return this.quartersReducer(result)
  }

  async getDepartmentWastageByQuartersSummary(departmentid) {
    if (!departmentid) throw new Error("departmentid required")
    const departmentWastageQuarters = `
      SELECT 
      CASE
          WHEN o.pricing = 'unit' THEN (dchx.debit * o.price)
          WHEN o.pricing = 'absolute' THEN (dchx.debit + o.price) 
      END AS debitAmount,
      MONTH(dchx.date) AS month,
      CASE
          WHEN MONTH(dchx.date)  BETWEEN 1 AND 4 THEN 1
          WHEN MONTH (dchx.date) BETWEEN 5 AND 8 THEN 2
          WHEN MONTH (dchx.date) BETWEEN 5 AND 8 THEN 3
      END AS quarter
      FROM departmentconsumptionhx AS dchx INNER JOIN orders AS o ON
          dchx.stockid = o.stockid
      INNER JOIN stocksbrands AS sb ON sb.brandid = dchx.brand
      WHERE
          dchx.wastage = 1   AND department = ? AND o.stockid = dchx.stockid AND dchx.batchnumber = o.batchnumber AND dchx.brand = o.brand GROUP BY dchx.batchnumber,dchx.brand, dchx.stockid
`
    const data = await promisifyQuery(departmentWastageQuarters, [departmentid])
    return await this.quartersReducer(data)
  }
}

module.exports = Inventoryanalytics
