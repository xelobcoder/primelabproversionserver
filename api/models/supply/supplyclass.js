const database_queries = require("../../database/queries")
const { promisifyQuery, paginationQuery } = require("../../../helper")
const ApplicationSettings = require("../application/settings")
const EmailService = require("../../EmailServices/EmailCore")

const NEWSUPPLIERQUERY = `INSERT INTO supplier (name,address,email,contactperson,region,phonenumber) VALUES (?,?,?,?,?,?)`
const GETSUPPLIERSQUERY = `SELECT * FROM supplier ORDER BY supplierid DESC LIMIT ? OFFSET ?`
const UPDATESUPPLIERQUERY = `UPDATE supplier SET name = ?, address = ?, region = ?, contactperson = ?, email = ?, phonenumber = ? WHERE supplierid = ?`

class Supplys {
  constructor(supplierid) {
    this.supplierid = supplierid
  }

  /**
   *
   * @param {Number} contact contact number of supplier
   * @param {String} email email contact of supplier
   * @returns Boolean
   */
  async isSupplierAvailable(contact, email) {
    if (!contact || !email) {
      throw new Error("email or contact required")
    }
    if (!email.toString().includes("@") || !email.toString().includes(".")) {
      return "WRONG EMAIL FORMAT PROVIDED"
    }

    if (contact.toString().length != 10) {
      return "INCORRECT CONTACT PROVIDED"
    }
    const query = `SELECT * FROM supplier WHERE phonenumber = ? OR email = ?`
    const result = await promisifyQuery(query, [contact, email])
    return result.length == 0
  }

  async sendEmailVerification(email, data) {
    const application_settings = await new ApplicationSettings().getApplicationSettings()
    if (application_settings["emailNotification"] == 1) {
      const e_service = new EmailService()
      const token = await e_service.generateToken(data, "30m")
      return await e_service.sendAuthenticateEmail(token, email, "EMAIL VERIFICATION NOTICE")
    }
  }

  async addSupplier(records, response) {
    const { name, address, email, contactperson, region, phonenumber } = records
    const canCreate = await this.isSupplierAvailable(phonenumber, email)
    if (canCreate == true) {
      const result = await promisifyQuery(NEWSUPPLIERQUERY, [name, address, email, contactperson, region, phonenumber])
      if (result.insertId != null) {
        // if email is activated ,send and email verification notification
        this.sendEmailVerification(email, { supplierid: result.insertId, email })
        return response.send({
          message: "supplier account created awaiting email account verification",
          statusCode: 200,
          status: "success",
        })
      } else {
        return response.send({
          message: "supplier contact creation failed",
          statusCode: 404,
          status: "success",
        })
      }
    } else if (canCreate == false) {
      return response.send({ message: "account already exist", statusCode: 404, status: "failed" })
    } else {
      return response.send({ message: canCreate, status: 'fialed' })
    }
  }

  async deleteSupplier(supplierid) {
    if (!supplierid) throw new Error("supplierid is required");
    const isdelted = await database_queries.del([supplierid], "supplier", "supplierid")
    return isdelted.affectedRows > 0
  }

  async getSuppliers(data) {
    try {
      return paginationQuery(data, GETSUPPLIERSQUERY)
    } catch (err) {
      throw new Error(err)
    }
  }
  async updateSupplier(records) {
    const { name, address, region, contactperson, email, phonenumber, supplierid } = records
    if (!supplierid) return false
    const values = [name, address, region, contactperson, email, phonenumber, supplierid]
    const outcome = await promisifyQuery(UPDATESUPPLIERQUERY, values)
    return outcome.affectedRows > 0 ? true : null
  }

  async getSupplier(supplierid) {
    if (!supplierid) return false
    return await database_queries.getsingleid([supplierid], "supplier", "SUPPLIERID")
  }

  async getSupplierPendingOrders(id, status = "data") {
    let supplierid = this.supplierid
    if (!supplierid) {
      supplierid = id
    }
    if (!supplierid) throw new Error("supplierid not provided")

    let query = `SELECT * FROM orders WHERE receiveddate IS NULL AND supplierid = ?`

    let result = await promisifyQuery(query, [parseInt(supplierid)])
    if (status == "count") return { count: result.length }
    return result
  }

  async postCommodity(records) {
    const { name, category } = records
    if (!name || !category) throw new Error("name and category required")
    const query = `INSERT INTO commodity (COMMODITY,CATEGORY) VALUES (?,?)`
    const result = await promisifyQuery(query, [name, category])
    return result.insertId != null
  }

  async getCommodity(commodity) {
    if (!commodity) throw new Error("commodity required")
    return await database_queries.getsingleid(commodity, "commodity", "commodity")
  }

  async getCommodities(query) {
    return await paginationQuery(query, `SELECT * FROM commodity GROUP BY comid LIMIT ? OFFSET ?`)
  }
}

module.exports = Supplys
