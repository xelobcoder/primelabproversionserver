const { rowAffected, customError, promisifyQuery } = require("../../../helper")
const logger = require("../../../logger")
const ApplicationSettings = require("./settings")

class Tax extends ApplicationSettings {
  constructor(id) {
    super(id)
  }

  async addTax(request, response) {
    const { value, name } = request.body
    if (!name || !value) return customError("name and value required", 401, response)
    try {
      // check if tax name exist
      const isExist = `SELECT * FROM tax WHERE name = ?`
      const existCount = await promisifyQuery(isExist, name)

      if (Array.isArray(existCount) && existCount.length > 0) {
        response.send({ message: "tax with such name availble", status: "success", statusCode: 406 })
      } else {
        const query = `INSERT INTO tax (name,value) VALUES (?,?)`
        let result = await promisifyQuery(query, [name, value])
        response.send({
          message: rowAffected(result) ? "tax added successfully" : "Error inserting new tax",
          status: "success",
          statusCode: 200,
        })
      }
    } catch (err) {
      logger.error(err)
      customError(`error occured`, 500, response)
    }
  }

  async getTax(request, response) {
    try {
      let result = await promisifyQuery(`SELECT * FROM tax`)
      response.send({ status: "success", statusCode: 200, result })
    } catch (err) {
      logger.error(err)
      customError(err?.message, 500, response)
    }
  }

  async updateTax(request, response) {
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
  async changeTaxStatus(request, response) {
    try {
      const { id, status } = request.body
      if (!id || typeof status !== "boolean") return customError("tax id and applystatus required", 404, response)

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

  async deleteTax(request, response) {
    try {
      const { id } = request.query
      if (!id) return customError("tax id  required", 404, response)
      const query = `DELETE FROM tax WHERE id  = ?`
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
}

module.exports = Tax
