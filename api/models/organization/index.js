const { promisifyQuery } = require("../../../helper")
const logger = require("../../../logger")

const INITQUERY = ` SUM(payable) AS payable, SUM(discount) AS discountedAmount, COUNT(*) AS referedCases
FROM billing WHERE organization = ?`

const MONTHLYSALESQUERY = `SELECT ` + INITQUERY + ` AND MONTH(billedon) = MONTH(CURRENT_DATE)`

const WEEKLYSALESQUERY = `SELECT 
            CASE 
              WHEN DAY(billedon) > 0 AND DAY(billedon) < 7 THEN 'firstWeek'
              WHEN DAY(billedon) > 7 AND DAY(billedon) <= 14 THEN 'secondweek'
              WHEN DAY(billedon) > 14 AND DAY(billedon)  <= 21 THEN 'thirdweek'
              ELSE 'fouthweek'
            END AS weeklySales,
            SUM(payable) AS payable,
            SUM(discount) AS discountedAmount,
            COUNT(billingid) AS referedCases 
            FROM billing WHERE organization = ? AND MONTH(billedon)  = MONTH(CURRENT_DATE) GROUP BY weeklySales
          `

const DAILYSALESQUERY = `SELECT DAY(billedon) AS day, ` + INITQUERY + ` AND YEAR(billedon) = YEAR(CURRENT_DATE) GROUP BY DAY(billedon)`

const TODAYSALESQUERY = `SELECT` + INITQUERY + ` AND DAY(billedon) = DAY(CURRENT_DATE)`

const YEARLYSALESQUERY = `SELECT SUM(payable) AS payable, SUM(discount) AS discountedAmount, COUNT(billingid) AS referedCases, YEAR(billedon) AS yearlySales
FROM billing WHERE organization = ? GROUP BY yearlySales`

class Organization {
  constructor(organizationId) {
    this.organizationId = organizationId || null
  }

  async getCommissionRate() {
    let commissionRate = 0
    const organizationInfo = await this.organizationAccountInfo()
    if (organizationInfo.length != 0 && organizationInfo[0]["commission"] != 0) commissionRate = organizationInfo[0]["commission"]
    return commissionRate
  }

  async calulateRate(data) {
    const commissionRate = await this.getCommissionRate()
    const payable = data[0]["payable"]
    const rate = parseFloat(payable) * (parseFloat(commissionRate) / 100)
    return { ...data[0], commissionRate: rate }
  }

  dafaultSalesParam = {
    discountedAmount: 0,
    payable: 0,
    commissionRate: 0,
    referedCases: 0,
  }

  async monthSales() {
    try {
      let monthly = await promisifyQuery(MONTHLYSALESQUERY, this.organizationId)
      if (monthly.length === 0) return monthly = this.dafaultSalesParam
      return monthly = await this.calulateRate(monthly)
    } catch (err) {
      throw new Error(err)
    }
  }

  async daySales() {
    try {
      let result = await promisifyQuery(TODAYSALESQUERY, this.organizationId)
      if (result.length === 0) {
        return result = this.dafaultSalesParam
      }
      return result = await this.calulateRate(result)
    } catch (err) {
      throw new Error(err)
    }
  }

  async weeklysales() {
    const commissionRate = await this.getCommissionRate()
    let result = await promisifyQuery(WEEKLYSALESQUERY, [this.organizationId])
    if (result.length === 0) {
      return (result = [])
    }
    result = result.map((item) => {
      const commission = parseFloat(item?.payable) * (parseFloat(commissionRate) / 100)
      return { ...item, value: commission, name: item?.weeklySales }
    })
    return result
  }

  async getYearlySales() {
    let result = await promisifyQuery(YEARLYSALESQUERY, [this.organizationId])
    if (result === 0) {
      result = this.dafaultSalesParam
      return result
    }
    result = await this.calulateRate(result)
    return result
  }

  async getDailySales() {
    let result = await promisifyQuery(DAILYSALESQUERY, [this.organizationId]);
    result = await Promise.all(result.map(async (a, i) => await this.calulateRate([a])));
    return result
  }

  async organizationAccountInfo() {
    return await promisifyQuery("SELECT * FROM organizationaccountinformation WHERE organizationid = ?", [this.organizationId])
  }

  async getOrganizationInfo() {
    return await promisifyQuery("SELECT * FROM organization WHERE id = ?", this.organizationId)
  }
  async generateSalesReport() {
    try {
      if (!this.organizationId) return false
      const monthly = await this.monthSales()
      const today = await this.daySales()
      const weekly = await this.weeklysales()
      const daily = await this.getDailySales()
      const yearly = await this.getYearlySales()
      const sales = { monthly, today, weekly, yearly, daily }
      return sales
    } catch (err) {
      logger.error(err);
      throw new Error(err)
    }
  }
}

module.exports = Organization
