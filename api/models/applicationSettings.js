const { customError, promisifyQuery, responseError, rowAffected } = require("../../helper")
const logger = require("../../logger")
const EmailService = require("../EmailServices/EmailCore")
const database_queries = require("../database/queries")

const applicationSettings = {}


applicationSettings.getApplicationSettings = async function (request, response) {
  const query = `SELECT * FROM applicationsettings`
  try {
    let result = await promisifyQuery(query)
    if (!response) {
      return result;
    } else {
      response.send({ message: "success", status: "success", statusCode: 200, result })
    }
  } catch (err) {
    logger.error(err)
  }
}

applicationSettings.getEmailPreference = async () => {
  const data = await database_queries.getsingleid(1, "emailpreference", "id")
  return data.length > 0 ? data[0] : {}
}

applicationSettings.shouldSendRejectionEmail = async () => {
  const settings = await applicationSettings.getApplicationSettings()
  let isServicesActivated = false
  let isRejectedPrefered = false
  if (settings.length > 0 && settings[0]["emailNotification"] == 1) {
    isServicesActivated = true
  }

  const rejectionPreference = await applicationSettings.getEmailPreference()
  if (rejectionPreference.length && rejectionPreference?.rejection == "Yes") {
    isRejectedPrefered = true
  }
  if (isRejectedPrefered && isServicesActivated) return true
  else return false
}

applicationSettings.updateApplicationSettings = async function (request, response) {
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
  } = request.body
  const query = `INSERT INTO applicationsettings (bulkregistration,fontsize,textcolor,BackgroundColor,DeactivateBilling24hrs,PaidBillsBeforeTransaction,completeFlow,approvalbeforeprinting,emailNotification) VALUES (?,?,?,?,?,?,?,?,?)`
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
  ]
  try {
    const result = await promisifyQuery(TruncateTable)
    if (result) {
      const isUpdated = await promisifyQuery(query, values)
      isUpdated && response.send({ message: "Applications settings updated successfully", statusCode: 200, status: "success" })
    }
  } catch (err) {
    logger.error(err)
    customError(err?.message, 500, response)
  }
}

applicationSettings.updateSmsSettings = async function (request, response) {
  try {
    const updateSms = await promisifyQuery(`UPDATE applicationsettings SET smsSettings = ?`, [JSON.stringify(request.body)])
    if (updateSms) {
      response.send({ message: "sms settings updated successfully", status: "success", statusCode: 200 })
    }
  } catch (err) {
    customError(err?.message, 500, response)
  }
}

applicationSettings.getSmsSettings = async function (request, response) {
  try {
    const result = await promisifyQuery(`SELECT smsSettings FROM applicationsettings`)
    if (result.length > 0) {
      const { smsSettings } = result[0]
      response.send(JSON.parse(smsSettings))
    } else {
      response.send({ registration: "", result: "", sample: "", birthday: "" })
    }
  } catch {
    logger.error(err)
  }
}

applicationSettings.updatePreference = async function (request, response) {
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

applicationSettings.generalEmailSettings = async function (records) {
  console.log(records)
  if (typeof records != "object") return false
  // first truncate the table
  const truncate = `TRUNCATE TABLE generalemailsettings`
  let isTruncated = await promisifyQuery(truncate)
  if (isTruncated) {
    return new EmailService().insertEmailSettings(records)
  }
}

applicationSettings.getGeneralEmaiSettings = async function () {
  try {
    const query = `SELECT * FROM generalemailsettings`
    return await promisifyQuery(query)
  } catch (err) {
    logger.error(err)
    return false
  }
}

applicationSettings.addTax = async function (request, response) {
  const { value, name } = request.body
  if (value && name) {
    try {
      // check if tax name exist
      const isExist = `SELECT * FROM tax WHERE name = ?`
      const existCount = await promisifyQuery(isExist, name)

      if (Array.isArray(existCount) && existCount.length > 0) {
        response.send({ message: "tax with such name availble", status: "success", statusCode: 406 })
      } else {
        const query = `INSERT INTO tax (name,value) VALUES (?,?)`
        let result = await promisifyQuery(query, [name, value])
        const { affectedRows } = result
        response.send({
          message: affectedRows > 0 ? "tax added successfully" : "Error inserting new tax",
          status: "success",
          statusCode: 200,
        })
      }
    } catch (err) {
      logger.error(err)
      customError(`error occured`, 500, response)
    }
  } else {
    customError("name and value required", 401, response)
  }
}

applicationSettings.getTax = async function (request, response) {
  try {
    let result = await promisifyQuery(`SELECT * FROM tax`)
    response.send({ status: "success", statusCode: 200, result })
  } catch (err) {
    logger.error(err)
    customError(err?.message, 500, response)
  }
}

applicationSettings.updateTax = async function (request, response) {
  try {
    const { id, value, name } = request.body
    if (!id || !value || !name) return customError("tax id , name and value are required", 404, response)

    const query = `UPDATE Tax SET name = ? , value = ? WHERE id = ?`
    const result = rowAffected(await promisifyQuery(query, [name, value, id]))
    response.send({
      message: result ? "updated successfully" : "failed updating",
      status: result ? "success" : "failed",
    })
  } catch (err) {
    responseError(response)
  }
}

applicationSettings.changeTaxStatus = async (request, response) => {
  try {
    const { id, status } = request.body
    if (!id || typeof status !== 'boolean') return customError("tax id and applystatus required", 404, response)

    const value = status === true ? "Yes" : "No"
    const query = `UPDATE Tax SET  apply  = ? WHERE id = ?`
    const result = rowAffected(await promisifyQuery(query, [value, id]))
    response.send({
      message: result ? "updated successfully" : "update failed",
      status: result ? "success" : "failed",
    })
  } catch (err) {
    logger.error(err)
    responseError(response)
  }
}
applicationSettings.deleteTax= async (request, response) => {
  try {
    const { id } = request.query;
    if (!id) return customError("tax id  required", 404, response);
    const query = `DELETE FROM tax WHERE id  = ?`;
    const result = rowAffected(await promisifyQuery(query, [id]))
    response.send({
      message: result ? "delete successful" : "delete failed",
      status: result ? "success" : "failed",
    })
  } catch (err) {
    logger.error(err)
    responseError(response)
  }
}


applicationSettings.getResultsettings = async (request, response) => {
  try {
    const query = `SELECT resultsettings FROM resultsettings`
    let result = await promisifyQuery(query)
    if (result.length != 0) {
      result = result[0]["resultsettings"]
      return response.send(result)
    }
    response.send({})
  } catch (err) {
    responseError(response)
  }
}

applicationSettings.updateResultSettings = async (request, response) => {
  try {
    const { data } = request.body
    if (!data) {
      return customError("data object required", 404, response)
    }
    if (Object.keys(data).length === 0) {
      return customError("type object with key values required", 404, response)
    }
    const jsonify = JSON.stringify(data)

    const query = `SELECT resultsettings FROM resultsettings`
    let result = await promisifyQuery(query)
    if (result.length === 0) {
      const insert = await promisifyQuery(`INSERT INTO resultsettings (resultsettings) VALUE(?)`, [jsonify])
      if (rowAffected(insert)) response.send({ status: "success", message: "update successful" })
      else response.send({ status: "error", message: "update failed" })
    } else {
      const update = await promisifyQuery(`UPDATE resultsettings SET resultsettings = ? WHERE id = 1`, [jsonify])
      if (rowAffected(update)) response.send({ status: "success", message: "update successful" })
      else response.send({ status: "error", message: "update failed" })
    }
  } catch (err) {
    console.log(err)
    responseError(response)
  }
}
module.exports = applicationSettings
