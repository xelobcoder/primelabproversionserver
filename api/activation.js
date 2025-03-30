const { promisifyQuery, rowAffected, paginationQuery } = require("../helper")
const logger = require("../logger")
const connection = require("./db")





const activation = {
  /**
   *
   * @param {request} request  http request object which the request query
   * @param {response} response  http response object
   */
  // getPartialData: async function (request, response) {
  //   //  get first top 20 data if the request quetry object is empty
  //   if (Object.keys(request.query).length == 0) {
  //     const activationQuery = ` 
  //     SELECT id,
  //     patientid,
  //     CASE 
  //       WHEN middlename IS NULL THEN CONCAT(firstname, ' ', lastname)
  //       ELSE CONCAT(firstname, ' ', middlename, ' ', lastname)
  //     END AS fullname,
  //     date, 
  //     activation_status
  //     FROM new_patients ORDER BY ID DESC LIMIT 10
  //       `
  //     const result = await promisifyQuery(activationQuery);
  //     response.send(result);
  //   } else {
  //     const { fullname, patientid, mobile, to, from } = request.query

  //     let activationQuery = `
  //       SELECT id,patientid,
  //       CASE 
  //         WHEN middlename IS NULL THEN CONCAT(firstname, ' ', lastname)
  //         ELSE CONCAT(firstname, ' ', middlename, ' ', lastname)
  //       END AS fullname,
  //       mobile_number AS contact,
  //       date, 
  //       activation_status
  //       FROM new_patients
  //   `
  //     if (patientid) {
  //       activationQuery += ` WHERE patientid =  ${patientid}`
  //     }

  //     if (!patientid && fullname) {
  //       activationQuery += ` WHERE firstname LIKE '%${fullname}' OR middlename LIKE '%${fullname}' OR lastname LIKE '%${fullname}'`
  //     } else if (fullname && patientid) {
  //       activationQuery += ` AND firstname LIKE '%${fullname}' OR middlename LIKE '%${fullname}' OR lastname LIKE '%${fullname}'`
  //     } else {
  //       activationQuery = activationQuery
  //     }

  //     if (mobile && !isNaN(mobile)) {
  //       if (!patientid && !fullname && mobile) {
  //         activationQuery += ` WHERE mobile_number = ${mobile}`
  //       } else {
  //         activationQuery += ` AND mobile_number = ${mobile}`
  //       }
  //     } else {
  //       activationQuery = activationQuery
  //     }

  //     if (patientid || fullname || mobile) {
  //       if (from) {
  //         activationQuery += ` AND date BETWEEN '${from}'`
  //       }

  //       if (to) {
  //         activationQuery += ` AND ${to}`
  //       } else {
  //         activationQuery += ` AND CURRENT_DATE`
  //       }
  //     } else {
  //       if (from) {
  //         activationQuery += ` WHERE date BETWEEN '${from}'`
  //       } else {
  //         activationQuery += ` WHERE date BETWEEN CURRENT_DATE `
  //       }
  //       if (to) {
  //         activationQuery += `  AND '${to}'`
  //       } else {
  //         activationQuery += ` AND CURRENT_DATE `
  //       }
  //     }

  //     activationQuery += ` ORDER BY id DESC
  //       LIMIT 10`

  //     connection.query(activationQuery, (err, result) => {
  //       if (err) {
  //         logger.error(err)
  //         response.send([])
  //       }
  //       if (result) {
  //         response.send(result)
  //       }
  //     })
  //   }
  // },

  // activateDeactivate: async function (data, response) {
  //   const { patientid, action } = data;
  //   if (!action) {
  //     throw error ({ message: "action required", status: "error", statusCode: 401 })
  //   }

  //   let queryString = `UPDATE new_patients SET activation_status = ?`
  //   if (patientid) {
  //     queryString += ` WHERE patientid = ?`
  //   }
  //   const result = rowAffected(await promisifyQuery(queryString, [action, patientid]));

  //   return response.send({
  //     message: "success",
  //     action: action === "TRUE" ? "BILLING" : "ACTIVATION PAGE",
  //   })
  // },
}

module.exports = activation


