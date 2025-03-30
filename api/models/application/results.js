const ApplicationSettings = require("./settings")
const { responseError,promisifyQuery,rowAffected } = require("../../../helper")
class ResultSettings extends ApplicationSettings {
  constructor(id) {
    super(id)
  }
  async getResultSettings(request, response) {
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
  async updateResultSettings(request, response) {
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
}


module.exports = ResultSettings;