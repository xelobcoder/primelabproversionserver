const connection = require("./db")
const logger = require("../logger")
const { convertKeysToLowerCase, promisifyQuery, customError, rowAffected, paginationQuery } = require("../helper")

// get all clinicians
const getClinicians = async (req, res) => {
  try {
    const { count, page } = req.query
    if (count > 0 && page >= 0) {
      let result = await paginationQuery({ page, count }, "SELECT * FROM clinicianbasicinfo LIMIT ? OFFSET ?")
      result = result.length > 0 ? result.map((item) => convertKeysToLowerCase(item)) : result
      res.send({ statusCode: 200, status: "success", result })
    } else {
      let result = await promisifyQuery("SELECT * FROM clinicianbasicinfo")
      result = result.length > 0 ? result.map((item) => convertKeysToLowerCase(item)) : result
      res.send({ statusCode: 200, status: "success", result })
    }
  } catch (err) {
    logger.error(err)
  }
}

// update clinicians
const putCliniciansbasic = async (req, res) => {
  //     we update the query
  const { name, phone, email, location, address, occupation, id } = req.body

  if (!id) {
    customError("Clinician id not added", 404, res)
    return
  }

  // check if id exist
  if (!isClinicianExist(id)) {
    customError("Clinician not found", 200, res)
    return
  }

  // update query
  let query = `UPDATE clinicianbasicinfo SET NAME = ?, PHONE = ?, EMAIL = ?, LOCATION = ?,
     ADDRESS = ?,OCCUPATION = ? WHERE ID = ?`

  const values = [name, phone, email, location, address, occupation, id]
  // execute query
  // is id available, if yes continue or send response with message of no id
  const isUpdated = await promisifyQuery(query, values)

  if (rowAffected(isUpdated)) {
    res.send({
      statusCode: 200,
      message: "Clinician updated successfully",
      status: "success",
    })
  } else {
    res.send({
      statusCode: 401,
      message: "Clinician not updated",
    })
  }
}

// delete clinician

const deleteClinicians = async (req, res) => {
  try {
    const { id } = req.body
    if (!id) {
      return customError("id required", 404, res)
    }
    let query = `DELETE FROM clinicianbasicinfo WHERE id = ?`
    const result = rowAffected(await promisifyQuery(query, [parseInt(id)]))
    if (result == true) {
      res.send({
        statusCode: 200,
        status: "success",
        message: "Deleted successfully",
      })
    } else {
      res.send({
        statusCode: 500,
        status: "error",
        message: "something occured. Wrong ID provided",
      })
    }
  } catch (err) {
    logger.error(err)
    customError("Something wrong occured deleting clinician record", 500, res)
  }
}

const isClinicianExist = async function (email, mobile) {
  if (!email || !mobile) return false
  const matched = await promisifyQuery(`SELECT * FROM clinicianbasicinfo WHERE EMAIL = ? OR phone = ?`, [email, mobile])
  return matched.length > 0 ? true : false
}

const postClinicianBasicInfo = async (req, res) => {
  const { id, name, phone, email, location, address, occupation, organization } = req.body

  if (!phone || !email) return `phone number and email required`

  const isValidNumber = (number) => {
    return number.length === 10 && number.startsWith(0 || "0")
  }

  // We check if number is valid and not more than 10 and begins with 0
  if (!isValidNumber(phone) || !email.includes("@")) return "Valid phonenumber and email required"

  if (await isClinicianExist(email, phone)) return "email or phone number is already registered with a clinician"

  // module, occupation, commission, momo, bankName, accountName, branch, account
  const values = [name, phone, email, location, address, occupation, organization]

  //  we insert into the database
  let query = `INSERT INTO clinicianbasicinfo 
            (name,phone,email,location,address,
            occupation,organization) 
            VALUES (?,?,?,?,?,?,?)`

  const result = await promisifyQuery(query, values)
  const { insertId } = result

  if (insertId !== 0) {
    // generate randams words and store it as temporay password
    const random = require("node:crypto").randomBytes(5).toString("hex")
    const tempCredentials = `UPDATE clinicianscredentials SET password  = ?`
    await promisifyQuery(tempCredentials, [random])
    return insertId
  }
  return "adding new clinician failed"
}

const getSingleClinician = (req, res) => {
  const { id } = req.query
  // get the id
  let query = `SELECT * FROM clinicianbasicinfo WHERE ID = ?`
  // execute query
  connection.query(query, [id], (err, result) => {
    if (err) {
      logger.error(err)
    }
    res.send({
      statusCode: 200,
      result,
      status: "success",
    })
  })
}

/**
 * Retrieves the top performing clinicians based on their total sales.
 *
 * @param {object} request - The request object containing the query parameters.
 * @param {object} response - The response object used to send the result back to the client.
 * @returns {void}
 */
const getTopPerformingClinicians = async function (request, response) {
  const { count } = request.query

  // Check if count parameter is provided
  if (!count) {
    response.send({
      message: "count represent top count required",
      statusCode: 401,
      status: "warning",
    })
  } else {
    let query_string = `
         SELECT DISTINCT c.ID AS id,
                  c.NAME AS name,
                  c.COMMISSION AS commissionRate,
                  c.COMMISSION / 100 * (
                  SELECT SUM(b.PAYABLE)
                  WHERE c.ID = c.ID
         ) AS commissionEarned,
            SUM(b.payable) AS TotalSales
         FROM clinician AS c
            INNER JOIN BILLING AS b ON b.CLINICIAN = c.ID
         GROUP BY c.ID,
            c.NAME ORDER BY TotalSales DESC
      `;
    query_string += ` LIMIT ${count}`
    // Execute the SQL query
    connection.query(query_string, function (err, result) {
      if (err) {
        // Send error response if query execution fails
        response.send({
          message: err.message,
          statusCode: 500,
          status: "error",
        })
      } else {
        // Send success response with the result
        response.send({
          result,
          statusCode: 200,
          status: "success",
        })
      }
    })
  }
}

const CLINICIAN_QUERY_SUM = `SELECT 
         b.billingid,
         np.patientid,
         tp.name,
         tt.testid,
         tt.approvalStatus AS approval,
         tt.collection,
         tt.ready,
         tt.processing,
         np.firstname,
         np.lastname,
         np.middlename,
         b.clinician,
         b.billedon
      FROM test_ascension AS tt INNER JOIN billing AS b ON tt.billingid = b.billingid
      INNER JOIN new_patients AS np ON np.patientid = b.patientid INNER JOIN test_panels AS tp ON tp.ID = tt.testid
      WHERE b.clinician = ?`

const getClinicianResult = async function (clinicianid, startdate, enddate) {
  try {
    let query = CLINICIAN_QUERY_SUM

    let values = [parseInt(clinicianid)]

    if (startdate && enddate) {
      query += ` AND DATE(b.billedon) BETWEEN ? AND ?`
      values.push(startdate)
      values.push(enddate)
    } else {
      query += ` AND DATE(b.billedon) = DATE(CURRENT_DATE) ORDER BY b.billedon DESC`
    }

    let result = await promisifyQuery(query, values)
    // get unique billingid

    let unique = [...new Set(result.map((item) => item.billingid))]

    let transformed = []

    for (let i = 0; i < unique.length; i++) {
      let current_filtered = result.filter((item) => item.billingid === unique[i])
      let obj = {}
      obj.billingid = unique[i]
      obj.fullname = current_filtered[0]?.firstname + " " + current_filtered[0]?.middlename + " " + current_filtered[0]?.lastname
      obj.billingdate = current_filtered[0]?.billedon
      let ready_count = current_filtered.filter((item) => item.ready === "true").length
      obj.ready_count = ready_count
      obj.totaltest = current_filtered.length;
      obj.patientid = current_filtered[0].patientid;
      transformed.push(obj)
    }

    return transformed
  } catch (error) {
    logger.error(error)
  }
}

const getBillingTestBasedByClinician = async function (billingid, clinicianid) {
  const query = CLINICIAN_QUERY_SUM + ` AND b.billingid = ?`
  const result = await promisifyQuery(query, [clinicianid, billingid])
  return result
}

module.exports = {
  getClinicians,
  putCliniciansbasic,
  deleteClinicians,
  postClinicianBasicInfo,
  getSingleClinician,
  getTopPerformingClinicians,
  getClinicianResult,
  getBillingTestBasedByClinician,
}
