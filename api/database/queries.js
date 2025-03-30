const { promisifyQuery } = require("../../helper")
const logger = require("../../logger")
const connection = require("../db")
// const { testResults } = require("../testResult")

// create an object

const database_queries = {
 
  checkduplicate: (type = "billingid", table, id, columnName, date = testResults.getTodayDateAndTime().date) => {
    // return a promise after operation
    return new Promise((resolve, reject) => {
      // check if the parameter exist in the database
      const SQL_QUERY = `SELECT * FROM ${table} WHERE CREATED_ON = '${date}' AND ${columnName} = ${id}`

      connection.query(SQL_QUERY, function (err, result) {
        console.log(result)
        const duplicates = result.length > 0 ? true : false
        err ? reject(err) : duplicates ? resolve(true) : resolve(false)
      })
    })
  },
  del: function (id, table, idresulver) {
    return new Promise((resolve, reject) => {
      //  query
      const SQL_QUERY = `DELETE FROM ${table} WHERE ${idresulver} = ${id}`
      connection.query(SQL_QUERY, function (err, result) {
        err ? reject(err) : resolve(result)
      })
    })
  },
  deleteMany: function (deleteArray, table) {
    // function for single delete
    let deleted = 0
    let target = deleteArray.length
    // loop through the array
    while (deleted < target) {
      this.del(deleteArray[deleted], table)
      deleted++
      if (deleted === target) {
        break
      }
    }
  },
  getall: function (table, limit) {
    let SQL_QUERY = `SELECT * FROM ${table} ORDER BY ID DESC LIMIT ${limit}`
    return new Promise((resolve, reject) => {
      connection.query(SQL_QUERY, function (err, result) {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  },
  addBranch: function (request, response) {
    const { name, email, contact, managerid, address } = request.body

    let SQL_QUERY = `INSERT INTO branch (name,address,email,contact,managerid) VALUES (?,?,?,?,?)`
    connection.query(SQL_QUERY, [name, address, email, contact, managerid], (err, result) => {
      if (err) {
        logger.error(err)
      }
      if (result) {
        response.send({
          status: "success",
          message: "new branch added",
        })
      }
    })
  },
  getBranch: async function (request, response) {
    let SQL_QUERY = `SELECT * FROM BRANCH  ORDER BY BRANCHID ASC LIMIT 20`
    if (request.query.branchid) {
      SQL_QUERY = `SELECT * FROM BRANCH WHERE BRANCHID  = ?`
    }
    connection.query(SQL_QUERY, [request.query.branchid], (error, result) => {
      if (error) {
        response.send({
          status: "error",
          message: "error occured",
          statusCode: 500,
        })
      } else {
        response.send({
          status: "success",
          result,
          statusCode: 200,
        })
      }
    })
  },
  editBranch: function (request, response) {
    const { branchid, name, date, address, email, contact, managerid } = request.body

    let SQL_QUERY = `UPDATE BRANCH 
          SET NAME = ?,
          contact = ?,
          address =? ,
          email = ? ,
          managerid = ?
     WHERE branchid = ?;
     `
    connection.query(SQL_QUERY, [name, contact, address, email, managerid, branchid], (err, result) => {
      if (err) {
        response.send({
          message: err.sqlMessage,
          statusCode: 500,
          status: "error",
        })
      }
      if (result) {
        response.send({
          message: `${name} updated successfully`,
          status: 200,
          status: "success",
        })
      }
    })
  },
  deleteBranch: function (branchid, request, response) {
    let SQL_QUERY = `DELETE FROM BRANCH WHERE BRANCHID = '${branchid}'`
    connection.query(SQL_QUERY, (err, result) => {
      if (err) {
        response.send({
          message: err.sqlMessage,
          status: 500,
          status: "error",
        })
      }
      if (result) {
        response.send({
          message: `branch deleted`,
          status: "success",
        })
      }
    })
  },
  getAllRoles: function (request, response) {
    let SQL_QUERY = "SELECT * FROM ROLES"
    connection.query(SQL_QUERY, (err, result) => {
      if (err) {
        response.send({
          status: "error",
          message: err.sqlMessage,
          statusCode: 500,
        })
      }
      if (result) {
        response.send({
          result,
          status: "success",
          statusCode: 200,
        })
      }
    })
  },
  getSingleRole: function (request, response, id) {
    let SQL_QUERY = `SELECT * FROM ROLES WHERE ROLEID = '${id}'`
    connection.query(SQL_QUERY, (err, result) => {
      if (err) {
        logger.error(err)
      }
      if (result) {
        response.send({
          data: result,
          status: "success",
        })
      }
    })
  },
  newRole: function (fullname, username, password, role, request, response) {
    let values = [fullname, username, role, password]
    console.log(arguments[3])
    let SQL_QUERY = "INSERT INTO ROLES (FULLNAME,USERNAME,ROLE,PASSWORD) VALUES(?,?,?,?)"
    connection.query(SQL_QUERY, values, (err, result) => {
      if (err) {
        logger.error(err)
      }
      if (result) {
        response.send({ message: `${fullname} added as a ${role}`, status: "success" })
      }
    })
  },
  updateRole: function (request, response) {
    const { fullname, username, role, password, roleid } = JSON.parse(request.body)

    let SQL_QUERY = `UPDATE ROLES SET FULLNAME = '${fullname}', 
   USERNAME = '${username}',
   PASSWORD = '${password}',
   ROLE =' ${role}'
   WHERE ROLEID = '${roleid}'
  `

    connection.query(SQL_QUERY, (err, result) => {
      if (err) {
        logger.error(err)
      }
      if (result) {
        response.send({
          message: "information updated successfully",
          status: 200,
        })
      }
    })
  },
  deletewithID: function (id, request, response) {
    let SQL_QUERY = `DELETE FROM ROLES WHERE ROLEID = '${id}'`
    connection.query(SQL_QUERY, (err, result) => {
      if (err) {
        logger.error(err)
      }
      response.send({
        message: "information deleted succesfully",
        status: 200,
      })
    })
  },
  // dropping a table
  deleteAllrows: function (tablename) {
    let SQL_QUERY = `TRUNCATE TABLE  ${tablename}`
    // return a promise
    return new Promise(function (resolve, reject) {
      connection.query(SQL_QUERY, (err, result) => {
        if (err) {
          reject(err)
        }
        if (result) {
          result.fieldCount == 0 ? resolve(true) : resolve(false)
        }
      })
    })
  },
  getsingleid: async function (id, table, idresulver) {
    return await promisifyQuery(`SELECT * FROM ${table} WHERE ${idresulver} = ?`, [id])
  },
  activateDeactivate: function (request, response) {
    const { id, status } = request.body

    if (!id || !status) {
      response.send({
        statusCode: 401,
        status: "error",
        message: "include the branchid and status",
      })
    }

    const activation = status == "activate" ? 1 : 0

    const queryString = `UPDATE BRANCH SET ACTIVATION = ? WHERE BRANCHID = ? `

    connection.query(queryString, [activation, id], (err, result) => {
      if (err) {
        response.send({
          statusCode: 500,
          message: err.message,
        })
      }
      if (result) {
        if (result.affectedRows == 1) {
          response.send({
            statusCode: 200,
            message: `${activation == 1 ? "activation successfull" : "deactivation successful"}`,
            status: "success",
          })
        } else {
          response.send({
            statusCode: 200,
            message: "No row affected",
            status: "success",
          })
        }
      }
    })
  },
}

module.exports = database_queries
