const connection = require("../db");
const User = require("../LobnosAuth/user");
const { customError, promisifyQuery, paginationQuery, responseError, rowAffected } = require("../../helper")
const logger = require("../../logger");
const client = require("../models/redisclient");
const Security = require("../models/security/security");

const createNewAccount = async (req, res) => {
  try {
    const { name, password, role, email, branch } = req.body
    if ((name == "" || password == "" || role == "", email == "" || !branch)) {
      return customError(400, "missing required params", res)
    }
    const user = new User(name, password, role, email,branch)
    const isUser = await user.checkUserExist()
    if (isUser) return customError(`user already exist`, 404, res)
    const hashedPassword = await user.hashPassword()
    const insert = await user.insertionOne(name, hashedPassword)
    if (insert) res.send({ status: "success", message: "user created successfully" })
  } catch (err) {
    res.send({ status: "error", message: err })
    logger.error(err)
  }
}

/**
 * Handles the login process for a user.
 * Checks if the provided username and password exist in the database.
 * If the login credentials are valid, it generates an access token for the user,
 * sets it as a cookie, and sends a success response.
 * If the login credentials are invalid, it sends an error response.
 *
 * @param {Object} req - The request object containing the user's login information.
 * @param {Object} res - The response object used to send the login response.
 * @returns {void}
 */
const userLogin = async (req, response) => {
  try {
    const { name, password, email, browserInformation } = req.body
    //  check if user and password exist in db
    const user = new User(name, password)
    const userExist = await user.checkLogins(email, password);

    if (!userExist) {
      return customError("Invalid Login credentials", 400, response)
    }
    let userinformation = await user.getUserData(email);
    const employeeid = userinformation['employeeid'];

    const security = new Security(employeeid);

    const isLoggedMultipleDevices = await security.getCanInitiateLogin();
    if (!isLoggedMultipleDevices) {
      return response.send({ status: 'multipleLogins' })
    }
    if (userinformation) {
      const user_needed_data = await user.processUserData(userinformation)
      if (typeof user_needed_data == 'string') {
        return customError(user_needed_data, 404, response)
      }
      const token = await user.createAccessTokenCredentials(
        process.env.ACCESS_TOKEN_SECRET,
        email, user_needed_data,
        security.loginDuration + "h");

      const sessionExpiryTime = await security.insertLoginHistory(browserInformation);
      return response.send({
            status: "success", statusCode: 200,
            message: "Login successful",
            user: user_needed_data, token,
            sessionExpiryTime
          })
      // await client.connect();
      // await client.set('SESSION_TOKEN', JSON.stringify({ user: user_needed_data, token }), { EX: 60 });
      // await client.disconnect();
    } else {
      return customError(`user not found`, 404, response)
    }
  } catch (err) {
    console.log(err)
  }
}

/**
 * Retrieves all login information from the "roles" table and sends the result as a response to the client.
 *
 * @param {Object} req - The request object containing information about the HTTP request.
 * @param {Object} res - The response object used to send the HTTP response.
 * @returns {void}
 */

const getAllLogins = async (req, res) => {
  const { name, email, contact, role } = req.query;
  try {
    let query = `
    SELECT
          rl.employeeid,
          rl.username,
          rl.role,
          rl.email,
          rl.branch,
          b.name AS branchname,
          rl.emailAuthenticated,
          rl.activation
    FROM roles AS rl INNER JOIN branch AS b ON rl.branch = b.branchid
    `;
    const vals = [];

    const conditions = [];

    if (name) {
      conditions.push("rl.username LIKE ?");
      vals.push(`%${name}%`);
    }

    if (email) {
      conditions.push("rl.email LIKE ?");
      vals.push(`%${email}%`);
    }

    if (role) {
      conditions.push("rl.role = ?");
      vals.push(role);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY rl.employeeid DESC LIMIT ? OFFSET ?`;
    const result = await paginationQuery(req.query, query, vals);
    return res.send({ status: "success", result, statusCode: 200 })
  } catch (err) {
    customError("something wrong occured", 301, res)
    logger.error(err)
  }
}

const deleteAccount = async (req, res) => {
  /**
   * Deletes an account from the database.
   *
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {void}
   */
  const { id } = req.body
  if (id == "") {
    res.send({
      status: 400,
      message: "Bad Request",
    })
  } else {
    // delete account
    const queryString = `DELETE FROM roles WHERE EMPLOYEEID = ?`
    // execute query
    let result = await promisifyQuery(queryString, [parseInt(id)]);
    if (rowAffected(result)) {
      res.status(200).send({
        statusCode: 200,
        status: "success",
        message: "employee record deleted successfully",
      })
    } else {
      res.status(200).send({
        statusCode: 200,
        status: "success",
        message: "",
      })
    }
  }
}

const getAUser = async (req, res) => {
  try {
    // using query string , get id from request and query db
    const { id } = req.query
    if (!id) {
      return customError("employeeid required", 404, res)
    }
    // execute query
    const queryString = `SELECT username,email,employeeid,role FROM roles WHERE employeeid = ?`

    const result = await promisifyQuery(queryString, [parseInt(id)])
    res.send({ result, message: "success", statusCode: 200 })
  } catch (err) {
    logger.error(err)
    responseError(res)
  }
}

/**
 * Updates the basic information of a user in the database.
 * If the employeeid is not included in the request body, it sends an error response.
 * Otherwise, it hashes the password using the User class, constructs an SQL query to update the user's information,
 * and executes the query using the connection object. Finally, it sends a success response with the appropriate message
 * based on the result of the query.
 *
 * @param {Object} req - The request object containing the user's information to be updated.
 * @param {Object} res - The response object used to send the result of the update operation.
 * @returns {Promise<void>} - A promise that resolves when the update operation is complete.
 */
const updateUserBasicInfo = async (req, res) => {
  const { employeeid, name, email, password, role, branch } = req.body

  if (!employeeid) {
    return res.status(401).send({
      statusCode: 401,
      message: "employeeid not included",
      status: "error",
    })
  }

  if (!branch) {
    return customError('User not assigned to a branch', 404, res);
  }

  try {
    const hashedPassword = await new User(name, password, role, email).hashPassword()
    const mtquery = `UPDATE roles 
            SET username = ?,email = ? ,
            password = ? , role = ?,
            branch = ?
            WHERE EMPLOYEEID = ?`

    const result = await promisifyQuery(mtquery,
      [name, email, hashedPassword, role, parseInt(branch), employeeid])
    const status = rowAffected(result);
    res.send({
      statusCode: 200,
      message: status ? 'record updated successfully' : 'updating record failed',
      status: status ? "success" : "failed",
    })
  } catch (error) {
    responseError(res);
    logger.error(error)
  }
}

const activateAUser = async function (request, response) {
  const { id, currentv } = request.body
  if (id == "") {
    response.send({
      status: 400,
      message: "Bad Request",
    })
  } else {
    const queryString = `UPDATE roles SET ACTIVATION = ? WHERE EMPLOYEEID = ?`
    // execute query
    connection.query(queryString, [currentv, id], (err, result) => {
      if (err) {
        response.status(400).send({
          statusCode: 301,
          message: "error occured",
        })
      } else {
        response.status(200).send({
          statusCode: 200,
          status: "success",
          message: result.affectedRows > 0 ? "record updated successfully" : "record not updated",
        })
      }
    })
  }
}

const getPermissions = async (permissions, response) => {
  const userClass = new User()
  const user = await userClass.userExistWithId(permissions)
  if (!user) throw new Error("User does not exist")
  const userData = user[0]
  let obj = {}
  for (const [key, value] of Object.entries(userData)) {
    if (key == "permissions") {
      if (value !== "{}") obj[key.toLowerCase()] = JSON.parse(value)
      if (value === null || value === undefined) obj[key.toLowerCase()] = {}
    }
  }
  return obj
}

const updateUserPermission = async function (request, response) {
  try {
    const { id } = request.query;
    const permissions = request.body;
    const queryString = `UPDATE roles SET PERMISSIONS = ? WHERE EMPLOYEEID = ?`;
    let update = await promisifyQuery(queryString, [JSON.stringify(permissions), parseInt(id)])
    if (rowAffected(update)) {
      sendResponse(response, 'updated successfully', 'success')
    } else {
      response.send({ statusCode: 404, status: "error", message: 'error updating records' })
    }
  } catch (err) {
    logger.error(err);
    responseError(response);
  }
}




function sendResponse(response, message, status, statusCode = 200) {
  response.send({
    statusCode: statusCode,
    message: message,
    status: status
  });
}


module.exports = {
  createNewAccount,
  getAllLogins,
  userLogin,
  getAUser,
  updateUserBasicInfo,
  deleteAccount,
  activateAUser,
  getPermissions,
  updateUserPermission
};

