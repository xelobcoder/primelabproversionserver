const { response } = require("express")
const { customError, promisifyQuery, paginationQuery, rowAffected, responseError } = require("../../helper")
const logger = require("../../logger")
const connection = require("../db")

class Payment {
  constructor(patientid) {
    this.patientid = patientid
  }

  getClientTransactionInformation = async (records) => {
    try {
      const { patientid, from, to, count = 10, page = 1 } = records
      const values = []

      let modelQuery = `
        SELECT 
          np.PATIENTID AS patientid,
          CONCAT(np.FIRSTNAME,' ',np.MIDDLENAME,' ',np.LASTNAME) AS fullname,
          np.EMAIL AS email,
          CONCAT(0,np.MOBILE_NUMBER) AS mobileNumber,
          b.BILLINGID AS billingid,
          b.OUTSTANDING AS outstanding,
          b.DISCOUNT AS discount,
          b.PAID_AMOUNT AS paid_amount,
          b.PAYABLE AS payable,
          DATE(b.billedon) as date
        FROM new_patients AS np
        INNER JOIN billing as b ON np.patientid = b.patientid
      `

      if (patientid) {
        modelQuery += ` WHERE np.PATIENTID = ?`
        values.push(parseInt(patientid))
      }

      if (from && patientid) {
        values.push(from)
        if (to) {
          modelQuery += ` AND DATE(b.billedon) BETWEEN ? AND ?`
          values.push(to)
        } else {
          modelQuery += ` AND DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`
        }
      } else if (!patientid && from) {
        values.push(from)
        if (!to) {
          modelQuery += ` WHERE DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`
        } else {
          modelQuery += ` WHERE DATE(b.billedon) BETWEEN ? AND ?`
          values.push(to)
        }
      } else {
        modelQuery = modelQuery
      }

      if (from || patientid) {
        modelQuery += ` ORDER BY b.billingid ASC LIMIT ? OFFSET ? `
      } else {
        modelQuery += ` ORDER BY b.billingid DESC LIMIT ? OFFSET ? `
      }

      const result = await paginationQuery({ count, page }, modelQuery, values)

      return result
    } catch (err) {
      logger.error(err)
      throw new Error(err)
    }
  }

  getClientFullOutstanding = async (patientid, billingid) => {
    if (!billingid || !patientid) {
      return `patientid && billing required`
    } else {
      let modelQuery = `SELECT SUM(PAID_AMOUNT) AS paid,SUM(PAYABLE) AS total FROM billing WHERE PATIENTID = ? `
      let result = await promisifyQuery(modelQuery, [patientid])
      if (result.length > 0) {
        const { total, paid } = result[0]
        const outstanding = total - paid
        return outstanding
      }
    }
  }

  getTransactionData = async function (patientid) {
    if (!patientid) {
      throw new Error("patientid not included")
    } else {
      let modelQuery = `SELECT * FROM billing AS b INNER JOIN new_patients AS np ON
      b.patientid = np.patientid WHERE np.patientid = ? `
      return promisifyQuery(modelQuery, [patientid])
    }
  }

  allClientDebtTransactions = async (patientid) => {
    if (!patientid) {
      return `billingid is required`
    } else {
      let modelQuery = `SELECT 
      billedon AS date,
      billingid,
      outstanding,
      paid_amount AS paid,
      payable,
      discount
      FROM billing 
      WHERE patientid = ?
      AND outstanding > 0`
      return promisifyQuery(modelQuery, [parseInt(patientid)])
    }
  }

  updateSingleTransactionDebt = async (billingid, paid, outstanding) => {
    const model = `UPDATE billing SET  PAID_AMOUNT = ?,OUTSTANDING = ? WHERE BILLINGID = ?`
    try {
      return promisifyQuery(model, [paid, outstanding, billingid])
    } catch (err) {
      return err
    }
  }

  updateTransactionHx = async (billingid, payment, amount, employeeid) => {
    const model = `INSERT INTO billingHx (BILLINGID,paymentmode,amount,employeeid) VALUES (?,?,?,?)`
    return promisifyQuery(model, [billingid, payment, amount, employeeid])
  }

  clearClientDebtBulk = async (patientid, amount, pymode, employeeid) => {
    try {
      if (!patientid) {
        return `billingid is required`
      } else {
        let debts = await this.allClientDebtTransactions(patientid)

        if (debts.length === 0) return "No Exist"

        const totalDebt = debts.reduce((a, b) => {
          return a + b.outstanding
        }, 0)

        if (totalDebt === amount) {
          const result = await Promise.all(
            debts.map(async (item, index) => {
              const { outstanding, payable, billingid } = item
              const dd = rowAffected(await this.updateSingleTransactionDebt(billingid, payable, 0))
              const tt = rowAffected(await this.updateTransactionHx(billingid, pymode, outstanding, employeeid))
              return dd && tt
            })
          )
          return result.some((a, b) => a == false) ? false : true
        } else {
          let balance = amount
          let current = 0
          let target = debts.length

          const updateDebtStatus = async (item,balance) => {
            if (balance <= 0) return 0
            const { outstanding, paid, payable, discount, billingid } = item
            if (outstanding > balance) {
              const paidAmout = parseFloat(paid) + balance
              const nwOutstanding = parseFloat(payable) - (parseFloat(discount) + parseFloat(paid) + parseFloat(balance))
              await this.updateSingleTransactionDebt(billingid, paidAmout, nwOutstanding)
              await this.updateTransactionHx(billingid, pymode, balance, employeeid)
              return balance = 0
            } else {
              await this.updateSingleTransactionDebt(billingid, payable, 0)
              await this.updateTransactionHx(billingid, pymode, outstanding, employeeid)
              return balance = balance - outstanding
            }
          }
          while (current <= target) {
            const remaining = await updateDebtStatus(debts[current],balance);
            balance = remaining
            current++;
          }
          return true
        }
      }
    } catch (err) {
      throw new Error(err);
    }
  }
  updatePayment = async (request, response) => {
    // get the current billing billinfo
    // update the record and update the database
    const { billingid, outstanding, pay, paymentMode } = request.body
    const result = await promisifyQuery(`SELECT * FROM BILLING WHERE billingid = ?`, [billingid])
    if (result.length > 0) {
      const previousPayment = result[0]["paid_amount"]
      const discount = result[0]["discount"]
      const oldstanding = result[0]["outstanding"]
      if (oldstanding <= 0) {
        response.send({ status: "success", statusCode: 200, message: "Client is in good standing" })
      } else {
        const newAmount = previousPayment + parseInt(pay)
        const notoutstanding = result[0]["payable"] - newAmount - discount
        const updateQuery = `UPDATE BILLING 
          SET outstanding = ?,
          paid_amount = ?
          WHERE billingid = ?
          `
        const values = [notoutstanding, newAmount, billingid]

        const updateInfo = await promisifyQuery(updateQuery, values)

        if (rowAffected(updateInfo)) {
          const inserted = await promisifyQuery(`INSERT INTO billingHx (BILLINGID,paymentmode,amount) VALUES (?,?,?)`, [
            billingid,
            paymentMode,
            pay,
          ])
          rowAffected(inserted) && response.send({ message: "Payment update successfully", statusCode: 200, status: "success" })
        }
      }
    } else {
      customError("No such transaction found", 404, response)
    }
  }
  paymentMode = async (request, response) => {
    try {
      const result = await promisifyQuery(`SELECT * FROM paymentmodes`)
      response.send({ data: result || [], status: "success", statusCode: 200 })
    } catch (err) {
      customError("somthing went wrong", 500, response)
    }
  }

  specificBillTransactionHx = async (request, response) => {
    try {
      const { billingid } = request.query
      if (!billingid) {
        customError("billingid is required as a query", 401, response)
        return
      }
      const result = await promisifyQuery(`SELECT * FROM billingHx WHERE BILLINGID = ?  ORDER BY KeyID DESC`, [billingid])
      response.send(result)
    } catch (err) {
      customError("somthing went wrong", 500, response)
    }
  }
}

module.exports = Payment
