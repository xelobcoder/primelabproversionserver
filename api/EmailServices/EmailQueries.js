const { promisifyQuery, rowAffected } = require("../../helper")

class EmailQueries {
  constructor(billingid) {
    this.billingid = billingid
  }

  async isEmailServiceActivated() {
    const appset = await promisifyQuery(`SELECT emailNotification FROM applicationsettings`)
    if (appset.length == 0) return false
    const emailActivation = appset[0]["emailNotification"]
    return emailActivation == "0" ? false : true
  }

  async getEmailPreference() {
    return await promisifyQuery(`SELECT * FROM emailpreference`)
  }

  async getEmailLog(start, limit = 10, response) {
    try {
      if (!start) return false
      const end = parseInt(start) + parseInt(limit)
      const query = `SELECT * FROM emaillog WHERE id BETWEEN ? AND ?  ORDER BY id DESC LIMIT ?`
      const result = await promisifyQuery(query, [start, end, limit])
      if (!response) return result
      response.send({ message: "success", statusCode: 200, result })
    } catch (err) {
      logger.error(err)
      if (response) customError(err, 404, response)
    }
  }

  async getTempClinicianCredentials(id) {
    try {
      if (!id) return null
      return await promisifyQuery(`SELECT * FROM clinicianscredentials WHERE clinicianid = ?`, [id])
    } catch (err) {
      logger.error(err)
    }
  }
  async customSearch(record) {
    try {
      const { email, category } = record
      const staffQuery = `SELECT * FROM roles WHERE email LIKE ? AND emailAuthenticated = 'true'`
      const patientQuery = `SELECT * FROM new_patients AS np INNER JOIN patients_settings AS pt ON pt.patientid = np.patientid WHERE np.email LIKE ? AND emailAuthenticated = 'true'`
      let result
      switch (category) {
        case "staff":
          result = await promisifyQuery(staffQuery, `%${email}%`)
          result = result.map((item) => {
            item = convertKeysToLowerCase(item)
            return { fullname: item?.username, email: item?.email, employeeid: item?.employeeid }
          })
          break
        case "clients":
          result = await promisifyQuery(patientQuery, `%${email}%`)
          break
        case "bulk clients":
          result = await promisifyQuery("SELECT email FROM new_patients")
          break
        case "bulk staff":
          result = await promisifyQuery("SELECT email FROM roles")
          break
        default:
          result = []
          break
      }
      return result
    } catch (err) {
      logger.error(err)
      return "error occured"
    }
  }

  async saveComposedEmailDraft(subject, draft, employeeid) {
    try {
      const query = `INSERT INTO composedemails (subject,body,employeeid) VALUES(?,?,?)`
      const result = await promisifyQuery(query, [subject, draft, employeeid])
      return result.affectedRows > 0 ? true : false
    } catch (err) {
      logger.error(err)
      return err?.message
    }
  }

  async updateEmailComposed(id, subject, draft, employeeid) {
    try {
      const query = `UPDATE composedemails SET subject = ?, body = ?, employeeid = ? WHERE id = ?`
      const result = await promisifyQuery(query, [subject, draft, employeeid, id])
      return result.affectedRows > 0 ? true : false
    } catch (err) {
      logger.error(err)
      return err?.message
    }
  }

  async updateEmailTarget(id, target, schedule) {
    if (!target || !id) return "provide target and id"
    if (typeof id !== "number") return TypeError("id must be type number")
    try {
      const update = `UPDATE composedemails SET target = ?, ispublished = ?, scheduledate = ? WHERE id = ?`
      return await promisifyQuery(update, [target, "true", schedule, id])
    } catch (err) {
      throw new Error(err?.message)
    }
  }

  async sendBulkEmails(id, target, category) {
    try {
      if (!id || !category) return "id and category are required"
      const table = category == "bulk clients" ? "new_patients" : "roles"

      const query = `SELECT email FROM ${table}`

      const array = await promisifyQuery(query)

      const getEmailInfo = await this.getComposedEmailDraft(null, 1, "full", id)

      if (getEmailInfo.length == 0) return false

      const { subject, body } = getEmailInfo[0]

      if (!Array.isArray(array)) return TypeError("array must be type array")

      if (array.length == 0) return false

      if ((configuration.possibleWorkers > 2 && array.length <= 10000) || (configuration.possibleWorkers <= 2 && array.length <= 200)) {
        array.forEach(async (item, index) => {
          const data = { subject, body, email: item?.email }
          await this.sendComposedEmail(data)
        })
        return true
      }
      return
    } catch (err) {
      logger.error(err)
      return false || err?.message
    }
  }

  async sendComposedEmail(records) {
    try {
      if (typeof records != "object") return false
      const { subject, body, email } = records
      if (!subject || !email || !body) return false
      const html = `<html><body>${body}</body></html>`
      const mailOptions = this.mailOptions(email, subject, html)
      return this.transportEmail(mailOptions)
    } catch (err) {
      logger.error(err)
      return false
    }
  }

  async isAddressAuthenticated(email, target) {
    if (!email || !target) return "email and target are required"
    if (target === "staff") {
    }
  }

  async publishEmail(records) {
    try {
      const { id, target, category, schedule } = records
      // update target and ispublished on the db table
      // try sending email to clients
      // if all bullk email, check cpu cores and if more than 2, send
      // else schedule a time when the server is less busy to send
      // mostly at night

      if (!(await this.isEmailServiceActivated())) return "Email service is not activated"

      const isBulk = ["bulk clients", "bulk staff"].includes(category)

      const isFormatValid = Array.isArray(target)

      let refinedTarget

      if (!isBulk && !isFormatValid) return "target must be an array of email addresses"

      if (!isBulk && isFormatValid) {
        refinedTarget = target.map((item) => {
          return { email: item?.email }
        })
        refinedTarget = JSON.stringify(refinedTarget)
      }

      if (isBulk) {
        refinedTarget = category
      }

      let publishOn

      if (schedule.date && schedule.time) {
        publishOn = new Date(`${schedule?.date} ${schedule?.time}`)
      }

      const isupdated = await this.updateEmailTarget(parseInt(id), refinedTarget, publishOn)

      if (isupdated.affectedRows == 0) return false

      if (refinedTarget == "all staffs" || refinedTarget == "all clients") {
        this.sendBulkEmails(id, target, category)
      } else {
        const getemail = await this.getComposedEmailDraft("published", 1, "full", id)
        if (getemail.length == 0) return false
        const { body, subject, target } = getemail[0]
        let parsedTarget

        if (target != "") parsedTarget = JSON.parse(target)
        if (parsedTarget && parsedTarget.length > 0) {
          parsedTarget.forEach(async (item, index) => {
            const data = { subject, body, email: item?.email }
            await this.sendComposedEmail(data)
          })
        }
        return true
      }
    } catch (err) {
      logger.error(err)
    }
  }
  async getComposedEmailDraft(target, limit = 20, mode, id) {
    try {
      let query = `SELECT `
      let values = []
      if (mode == "brief") {
        query += `id,created_on,ispublished,subject,target,employeeid FROM composedemails`
      } else {
        query += ` * FROM composedemails`
      }
      if (target == "draft") {
        query += ` WHERE ispublished = 'false'`
      }
      if (target == "published") {
        query += ` WHERE ispublished = 'true'`
      }

      if (id != null && target) {
        query += ` AND id = ?`
        values.push(parseInt(id))
      }

      if (id != null && !target) {
        query += ` WHERE id = ?`
        values.push(parseInt(id))
      }

      query += ` order by id desc limit ?`
      values.push(parseInt(limit))

      return await promisifyQuery(query, values)
    } catch (err) {
      logger.error(err)
      return err?.message
    }
  }
  async getEmailSummaryByDay(response) {
    try {
      const query = `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, COUNT(id) AS total,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS success FROM emaillog GROUP BY DATE_FORMAT(date, '%Y-%m-%d')`
      const result = await promisifyQuery(query)
      if (response) response.send({ status: "success", statusCode: 200, result })
      return result
    } catch (err) {
      logger.error(err)
      if (response) {
        customError(err, 404, response)
        return
      }
      return "error occured"
    }
  }

  async emailSummary(response) {
    try {
      const query = `SELECT COUNT(id) AS total,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS success FROM emaillog`
      const result = await promisifyQuery(query)
      if (response) return response.send({ status: "success", statusCode: 200, result })
      return result
    } catch (err) {
      logger.error(err)
      if (response) {
        customError(err, 404, response)
        return
      }
      return "error occured"
    }
  }

  async isEmailAuthenticated(identifier, target) {
    try {
      // we want to verify using the patientid if patient is authenticated via email
      let result = false

      if (target === "patient") {
        result = await promisifyQuery(`SELECT * FROM patients_settings WHERE PATIENTID = ?`, [identifier])
        if (result.length === 0) return false
        const { authenticated, authenticationMode } = result[0]
        return (authenticationMode === "email") & (authenticated == 1) ? true : false
      }

      if (target === "clinician") {
        result = await promisifyQuery(`SELECT * FROM clinicianscredentials WHERE clinicianid = ?`, [identifier])
        if (result.length === 0) return false
        const { isAuthenticated, authenticationMode } = result[0]
        return (authenticationMode === "email") & (isAuthenticated == 1) ? true : false
      }
      return result
    } catch (err) {
      logger.error(err)
      return new Error(err)
    }
  }

  async updateAuthMode(target, identifier) {
    if (!identifier || !target) return "required params not provided"
    try {
      let query = ""
      if (target === "patient") {
        query = `UPDATE patients_settings SET authenticationMode = 'email', emailAuthenticated = 'true' WHERE patientid = ?`
      }
      if (target === "clinician") {
        query = `UPDATE clinicianscredentials SET authenticationMode = 'email', isAuthenticated = 1,authenticatedon = NOW() WHERE clinicianid = ?`
      }
      if (!query) return false
      return rowAffected(await promisifyQuery(query, [identifier]))
    } catch (err) {
      throw new Error(err)
    }
  }
}

module.exports = EmailQueries
