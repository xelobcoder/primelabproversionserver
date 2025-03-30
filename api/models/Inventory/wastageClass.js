const { promisifyQuery, rowAffected, paginationQuery } = require("../../../helper")
const Departments = require("../Departments/DepartmentClass");
const Inventory = require("./inventoryclass")

class WastageInventory extends Inventory {
  constructor(stockid) {
    super();
    this.stockid = stockid
  }

  async calculateProductInstock(stockid, brand, batchnumber) {
    let data = await promisifyQuery(`SELECT quantity as qty from mainstoresupply  WHERE stockid = ? AND batchnumber = ? AND brandid  = ?`, [
      stockid,
      batchnumber,
      brand,
    ])

    const qtyReceived = data.length > 0 ? data[0]["qty"] : 0;
    // const debitHx = await this.getDebitHxSingle(productordersid)
    // if (debitHx.length === 0) return qtyReceived

    // const totalDebited = debitHx.reduce((p, c, i) => p + c?.debitqty, 0)
    // return parseInt(qtyReceived) - parseInt(totalDebited)
    return qtyReceived;
  }

  async getOrderWastageData(stockid, brandid, batchnumber) {
    return await promisifyQuery(
      `SELECT * FROM generalstoredebithx WHERE stockid = ? AND brandid  = ? AND batchnumber = ?  AND wastage = 1`,
      [stockid, brandid, batchnumber]
    )
  }

  async calcalulateWastageTotal(stockid, brandid, batchnumber) {
    if (!stockid || !batchnumber || !brandid)
      throw new Error("batchnumber , stockid && brandid are required")
    let data = await this.getOrderWastageData(stockid, brandid, batchnumber)
    if (data.length === 0) return 0
    data = data.reduce((acc, cur) => acc + cur?.debitqty, 0)
    return data
  }

  async updateOrdersWastage(productordersid, state) {
    const updateQ = `UPDATE orders SET expiredDisposed = ?, disposaldate = NOW() WHERE productordersid = ?`
    return await promisifyQuery(updateQ, [state, productordersid])
  }

  async isWastageDebitHxExist(productordersid) {
    const result = await promisifyQuery(`SELECT * FROM generalstoredebithx WHERE wastage = 1 AND productordersid = ?`, [productordersid])
    return result.length > 0
  }

  async disposeoffExpireProduct(records) {
    const { productordersid, brandid, stockid, batchnumber } = records
    if (!productordersid) {
      throw new Error("required keys not found in object provided")
    }

    if (await this.isWastageDebitHxExist(productordersid)) return "EXIST"
    const total = await this.calculateProductInstock(stockid, brandid, batchnumber)
    try {
      await this.addDebitHx(productordersid, stockid, batchnumber, brandid, total, 1)
      await this.updateOrdersWastage(productordersid, 1)
      return true
    } catch (err) {
      console.log(err)
      logger.error(err)
    }
  }

  async disposeoffDeptProduct(records) {
    const { brandid, stockid, batchnumber, departmentid, employeeid, qtyAvailable } = records

    if (!departmentid || !stockid || !batchnumber || !brandid || !employeeid) {
      throw new Error("departmentid,batchnumber,employeeid, brandid and stockid required")
    }

    const query = `UPDATE departmentsmainsupply SET expiredDisposed = ?, 
          disposaldate = NOW(),
          quantity = 0,
          employeeid = ?
      WHERE departmentid = ? AND batchnumber = ? AND brand = ? AND stockid = ?`

    const queryR = await promisifyQuery(query, [
      1,
      parseInt(employeeid),
      parseInt(departmentid),
      batchnumber,
      parseInt(brandid),
      parseInt(stockid),
    ])

    const isdisposed = rowAffected(queryR)
    return isdisposed
  }

  async getQuarterlyData(quarters, count = 10, page = 1) {
    if (!quarters && !(quarters < 3 && quarters > 0)) {
      throw new Error("quarters are required and must be between 1 and 3")
    }

    let query = `SELECT 
            sb.brand,
            dhx.batchnumber,
            o.name,
            o.expirydate,
            MONTH(dhx.debitdate) AS month,
            dhx.debitdate,
            o.receiveddate,
            o.pricing,
            o.price,
            dhx.debitqty,
     CASE
       WHEN o.pricing = 'unit' THEN (dhx.debitqty * o.price)
       WHEN o.pricing = 'absolute' THEN (dhx.debitqty + o.price) 
    END AS debitAmount
    FROM generalstoredebithx AS dhx INNER JOIN orders AS o ON o.productordersid = dhx.productordersid INNER JOIN stocksbrands AS sb ON sb.brandid = dhx.brandid
     WHERE dhx.wastage = 1`

    if (quarters == 1) query += ` AND MONTH(dhx.debitdate)  BETWEEN 1 AND 4`
    if (quarters == 2) query += ` AND MONTH(dhx.debitdate)  BETWEEN 5 AND 8`
    if (quarters == 3) query += ` AND MONTH(dhx.debitdate)  BETWEEN 5 AND 12`

    query += ` LIMIT ? OFFSET ?`

    return await paginationQuery({ count, page }, query)
  }

  async getMonthlySummaryByQuarters(quarters) {
    let query = `SELECT 
    MONTH(dhx.debitdate) AS month,
    CASE
    WHEN o.pricing = 'unit' THEN (dhx.debitqty * o.price)
    WHEN o.pricing = 'absolute' THEN (dhx.debitqty + o.price) 
    END AS debitAmount
    FROM generalstoredebithx AS dhx INNER JOIN orders AS o ON o.productordersid = dhx.productordersid INNER JOIN stocksbrands AS sb ON sb.brandid = dhx.brandid
    WHERE dhx.wastage = 1
`

    if (quarters == 1) query += ` AND MONTH(dhx.debitdate)  BETWEEN 1 AND 4`
    if (quarters == 2) query += ` AND MONTH(dhx.debitdate)  BETWEEN 5 AND 8`
    if (quarters == 3) query += ` AND MONTH(dhx.debitdate)  BETWEEN 5 AND 12`

    return await promisifyQuery(query)
  }

  async getDeptMonthlySummaryWastages(quarters, departmentid) {
    if (!departmentid || !quarters) {
      throw new Error("derpartmentid and quarters required and quarters must be less than 3 and more than 0")
    }
    if (quarters <= 0 || quarters > 3) {
      throw new Error('range must be with 1-3');
    }
    let query = `SELECT 
                      CASE
                          WHEN o.pricing = 'unit' THEN (dchx.debit * o.price)
                          WHEN o.pricing = 'absolute' THEN (dchx.debit + o.price) 
                      END AS debitAmount,
                      MONTH(dchx.date) AS month
                      FROM departmentconsumptionhx AS dchx INNER JOIN orders AS o ON
                          dchx.stockid = o.stockid
                      INNER JOIN stocksbrands AS sb ON sb.brandid = dchx.brand
                      WHERE
        dchx.wastage = 1   AND dchx.department = ? AND o.stockid = dchx.stockid AND dchx.batchnumber = o.batchnumber AND dchx.brand = o.brand
        GROUP BY dchx.batchnumber,dchx.brand, dchx.stockid`

    if (quarters == 1) query += ` AND MONTH(dchx.date)  BETWEEN 1 AND 4`
    if (quarters == 2) query += ` AND MONTH(dchx.date)  BETWEEN 5 AND 8`
    if (quarters == 3) query += ` AND MONTH(dchx.date)  BETWEEN 5 AND 12`

    // query += ` GROUP BY dchx.batchnumber,dchx.brand, dchx.stockid`

    return await promisifyQuery(query, [parseInt(departmentid)]);
  }

  async getDeptQuarterlyWastageData(quarters, departmentid, count = 10, page = 1) {
    if (!quarters || !(quarters < 4 && quarters > 0) || !departmentid) {
      throw new Error("quarters are required and must be between 1 and 3 and departmentid required")
    }

    let query = `SELECT 
            sb.brand,
            dchx.batchnumber,
            o.name,
            o.expirydate,
            MONTH(dchx.date) AS month,
            dchx.date AS debitdate,
            o.pricing,
            o.price,
            dchx.debit as debitqty,
     CASE
       WHEN o.pricing = 'unit' THEN (dchx.debit * o.price)
       WHEN o.pricing = 'absolute' THEN (dchx.debit + o.price) 
    END AS debitAmount
    FROM departmentconsumptionhx AS dchx INNER JOIN orders AS o ON
    dchx.stockid = o.stockid
     INNER JOIN stocksbrands AS sb ON sb.brandid = dchx.brand
     WHERE dchx.wastage = 1   AND department = ? AND o.stockid = dchx.stockid AND dchx.batchnumber = o.batchnumber AND dchx.brand = o.brand`

    if (quarters == 1) query += ` AND MONTH(dchx.date)  BETWEEN 1 AND 4`
    if (quarters == 2) query += ` AND MONTH(dchx.date)  BETWEEN 5 AND 8`
    if (quarters == 3) query += ` AND MONTH(dchx.date)  BETWEEN 5 AND 12`

    query += ` GROUP BY dchx.batchnumber,dchx.brand, dchx.stockid LIMIT ? OFFSET ?`

    return await paginationQuery({ count, page }, query, [departmentid])
  }
}

module.exports = WastageInventory

