const { customError, promisifyQuery, responseError, rowAffected } = require("../../../helper")
const logger = require("../../../logger")

class ApplicationSettings {
  constructor(id) {
    this.id = 1
  }

  async getApplicationSettings(request, response) {
    const query = `SELECT * FROM applicationsettings`
    try {
      let result = await promisifyQuery(query)
      if (!response) {
        return promisifyQuery(query)
      } else {
        response.send({ message: "success", status: "success", statusCode: 200, result })
      }
    } catch (err) {
      logger.error(err)
      responseError(response)
    }
  }

  async getApplicationSettingsBilling(request, response) {
    try {
      const settings = await this.getApplicationSettings()
      if (settings.length === 0) response.send({})
      const { includeTax, PaidBillsBeforeTransaction } = settings[0]
      if (includeTax === 0) {
        return response.send({ includeTax, taxValue: 0, PaidBillsBeforeTransaction })
      }
      const getTax = await promisifyQuery(`SELECT * FROM tax WHERE apply = 'Yes'`)
      if (getTax.length == 0) {
        return response.send({ includeTax, taxValue: 0, PaidBillsBeforeTransaction })
      } else {
        const taxValue = getTax.reduce((a, b, index) => {
          return a + b.value
        }, 0)
        return response.send({ includeTax, taxValue, PaidBillsBeforeTransaction })
      }
    } catch (err) {
      responseError(response)
    }
  }

  async getEmailPreference() {
    let data = await database_queries.getsingleid(1, "emailpreference", "id")
    if (data.length > 0) {
      delete data[0]["id"]
      delete data[0]["updated_on"]
      delete data[0]["created_on"]
    }
    return data.length > 0 ? data[0] : {}
  }

  async shouldSendRejectionEmail() {
    const settings = await this.getApplicationSettings()
    let isServicesActivated = false
    let isRejectedPrefered = false
    if (settings.length > 0 && settings[0]["emailNotification"] == 1) {
      isServicesActivated = true
    }

    const rejectionPreference = await this.getEmailPreference()
    if (rejectionPreference.length && rejectionPreference?.rejection == "Yes") {
      isRejectedPrefered = true
    }
    if (isRejectedPrefered && isServicesActivated) return true
    else return false
  }

  async updateApplicationSettings(request, response) {
    const {
      bulkregistration,
      emailNotification,
      fontsize,
      textcolor,
      DeactivateBilling24hrs,
      BackgroundColor,
      PaidBillsBeforeTransaction,
      completeFlow,
      approvalbeforeprinting,
      includeTax,
    } = request.body
    const query = `INSERT INTO applicationsettings (bulkregistration,fontsize,textcolor,BackgroundColor,DeactivateBilling24hrs,PaidBillsBeforeTransaction,completeFlow,approvalbeforeprinting,emailNotification,includeTax) VALUES (?,?,?,?,?,?,?,?,?,?)`
    const TruncateTable = `TRUNCATE TABLE applicationsettings`
    const values = [
      bulkregistration,
      fontsize,
      textcolor,
      BackgroundColor,
      DeactivateBilling24hrs,
      PaidBillsBeforeTransaction,
      completeFlow,
      approvalbeforeprinting,
      emailNotification,
      includeTax,
    ]
    try {
      const result = await promisifyQuery(TruncateTable);
      if (result) {
        const isUpdated = await promisifyQuery(query, values)
        isUpdated && response.send({ message: "Applications settings updated successfully", statusCode: 200, status: "success" })
      }
    } catch (err) {
      customError(err?.message, 500, response)
    }
  }

  async updateSmsSettings(request, response) {
    console.log(request.body)
    try {
      const updateSms = await promisifyQuery(`UPDATE applicationsettings SET smsSettings = ?`, [JSON.stringify(request.body)])
      if (updateSms) {
        response.send({ message: "sms settings updated successfully", status: "success", statusCode: 200 })
      }
    } catch (err) {
      customError(err?.message, 500, response)
    }
  }

  async getSmsSettings(request, response) {
    try {
      const result = await promisifyQuery(`SELECT smsSettings FROM applicationsettings`)
      if (result.length > 0) {
        const { smsSettings } = result[0]
        response.send(JSON.parse(smsSettings))
      } else {
        response.send({ registration: "", result: "", sample: "", birthday: "" })
      }
    } catch {
      customError("error occured getting sms settings", 404, response)
      logger.error(err)
    }
  }

  async updateEmailPreference(request, response) {
    const { registration, rejection, result, approval, transactions, birthday, billing } = request.body
    // truncate the table
    const truncate = await promisifyQuery(`TRUNCATE TABLE emailpreference`)

    if (!truncate) {
      customError("error occured", 500, response)
      return
    }

    const query = `INSERT INTO emailpreference (registration,result,rejection,approval,transactions,birthday,billing) VALUES (?,?,?,?,?,?,?)`
    const values = [registration, result, rejection, approval, transactions, birthday, billing]
    try {
      const result = await promisifyQuery(query, values)
      if (result) {
        response.send({ message: result.affectedRows == 1 ? "updated successfully" : "update failed", status: "success", statusCode: 200 })
      }
    } catch (err) {
      logger.error(err)
      customError(err?.message, 500, response)
    }
  }

  async getRegistrationSettings() {
    return await promisifyQuery(`SELECT * FROM registrationsettings LIMIT 1`)
  }

  async updateRegisFields(id, data, employeeid) {
    const query = `UPDATE registrationsettings SET fields = ?, updatedby = ?, updatedon = NOW() WHERE id = ?`

    return rowAffected(await promisifyQuery(query, [data, employeeid, id]))
  }

  async insertRegistrationSettings(fields, employeeid) {
    const query = `INSERT INTO registrationsettings (fields,updatedby) VALUES (?,?)`

    return rowAffected(await promisifyQuery(query, [JSON.stringify(fields), employeeid]))
  }

  async updateRegistrationFields(request, response) {
    const { fields, employeeid } = request.body

    if (!fields || !employeeid) {
      return customError("fields or employeeid not provided", 404, response)
    }

    const previous = await this.getRegistrationSettings()
    if (previous.length > 0) {
      const fieldid = previous[0]["id"]
      return this.updateRegisFields(fieldid, JSON.stringify(fields), employeeid)
    } else {
      return this.insertRegistrationSettings(fields, employeeid)
    }
  }
  async getGeneralEmailSettings() {
    try {
      const query = `SELECT * FROM generalemailsettings`
      return await promisifyQuery(query)
    } catch (err) {
      logger.error(err)
      throw new Error(err)
    }
  }

  async updateGeneralEmailSettings(records) {
    if (typeof records != "object") return false
    // first truncate the table
    const truncate = `TRUNCATE TABLE generalemailsettings`
    let isTruncated = await promisifyQuery(truncate)
    if (isTruncated) {
      return new EmailService().insertEmailSettings(records)
    }
  }
}

module.exports = ApplicationSettings
