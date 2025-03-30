const { promisifyQuery, responseError } = require("../../../../helper.js")


const sales = {}

sales.generalSales = async function (target, branch, clinicianid = null, patientid, response) {
  try {
    // get all sales sum grouped by target i.e sum by year, month or day
    let query = ""

    if (target == "yearly") {
      query = `SELECT 
    SUM(PAYABLE) AS salesAmount,
    COUNT(b.BILLINGID) AS totalCases,
    YEAR(b.billedon) AS 'Year'
    FROM billing AS b`

      if (patientid) {
        query += ` WHERE b.PATIENTID = ${patientid}`
      }
      if (branch != "all") {
        query += ` WHERE b.branchid = ${branch}`
      }

      if (!patientid && branch == 'all' && clinicianid) {
        query += ` WHERE b.clinician= ${parseInt(clinicianid)}`
      }

      query += ` GROUP BY YEAR(b.billedon)`
    } else if (target == "monthly") {
      query = `SELECT
    SUM(PAYABLE) AS salesAmount,
    COUNT(b.BILLINGID) AS totalCases,
    MONTHNAME(b.billedon) AS 'Month'
    FROM billing AS b
    WHERE YEAR(b.billedon) = YEAR(CURDATE())
`
      if (patientid) {
        query += ` AND b.PATIENTID = ${patientid}`
      }

      if (branch != "all") {
        query += ` AND b.branchid = ${branch}`
      }

      if (clinicianid) {
        query += ` AND b.clinician= ${parseInt(clinicianid)}`
      }

      query += ` GROUP BY MONTH(b.billedon) `
    } else if (target == "daily") {
      query = ` SELECT
          SUM(b.PAYABLE) AS salesAmount,
          COUNT(b.BILLINGID) AS totalCases,
          SUM(b.DISCOUNT) AS discount,
          SUM(PAID_AMOUNT) AS totalAmountReceived,
          b.billedon AS date,
              DAY(b.billedon) AS 'Day'
          FROM billing AS b
       WHERE YEAR(b.billedon) = YEAR(CURDATE()) AND MONTH(b.billedon) = MONTH(CURDATE())`

      if (patientid) {
        query += ` AND b.PATIENTID = ${patientid}`
      }

      if (branch != "all") {
        query += `AND b.branchid = ${branch}`
      }
      if (clinicianid) {
        query += ` AND b.clinician= ${parseInt(clinicianid)}`
      }
      query += ` GROUP BY DAY(b.billedon)`
    } else {
      // weekly
      query = `
       SELECT
        SUM(PAYABLE) AS salesAmount,
        CASE
            WHEN DAY(b.billedon) BETWEEN 1 AND 7 THEN 'First Week'
            WHEN DAY(b.billedon) BETWEEN 8 AND 14 THEN 'Second Week'
            WHEN DAY(b.billedon) BETWEEN 15 AND 21 THEN 'Third Week'
            WHEN DAY(b.billedon) BETWEEN 22 AND 31 THEN 'Fourth Week'
        END AS 'Week',
        COUNT(b.BILLINGID) AS totalCases
      FROM billing AS b
      WHERE YEAR(b.billedon) = YEAR(CURDATE())
      AND MONTH(b.billedon) = MONTH(CURDATE())`
      if (patientid) {
        query += ` AND b.PATIENTID = ${patientid}`
      }
      if (branch != "all") {
        query += `AND b.branchid = ${branch}`
      }

      if (clinicianid) {
        query += ` AND b.clinician= ${parseInt(clinicianid)}`
      }

      query += ` GROUP BY WEEK`
    }

    const result = await promisifyQuery(query);
    if (clinicianid && result.length > 0) {
      const details = await promisifyQuery(`SELECT * FROM clinicianpaymentinfo WHERE ID = ?`, [parseInt(clinicianid)])

      const commission = details.length > 0 ? details[0]["commission"] : 0

      if (commission == null || commission == 0) {
        if (response) {
          return response.send({ status: "warning", message: "commission not set" })
        }
        return 'commission not set';
      }

      const commissionRate = commission / 100

      const report = result.map((item, index) => {
        const { salesAmount } = item
        return { ...item, salesAmount: salesAmount * commissionRate, rate: commissionRate }
      })
      if (response) {
        return response.send({ statusCode: 200, status: "success", result: report })
      }
      return report;
    } else {
      if (response) {
        return response.send({ statusCode: 200, status: "success", result })
      }
      return result;
    }
  } catch (err) {
    responseError(response)
  }
}

sales.getDailySalesSummary = async function (branchid, current_date) {
  let query = `SELECT
      SUM(b.PAYABLE) AS salesAmount,
      COUNT(b.BILLINGID) AS totalCases,
      SUM(b.DISCOUNT) AS discount,
      SUM(PAID_AMOUNT) AS totalAmountReceived,
      b.billedon AS date,
          DAY(b.billedon) AS 'Day'
      FROM billing AS b
    WHERE DATE(billedon) = '${current_date}'`;

  if (branchid) {
    query += ` AND branchid = ?`;
  }
  const result = await promisifyQuery(query, [branchid]);
  return result[0];
}
// sales.ClientSummary =

module.exports = sales
