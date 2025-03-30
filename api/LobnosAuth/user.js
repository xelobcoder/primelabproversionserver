const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const logger = require("../../logger")
const { convertKeysToLowerCase, promisifyQuery, customError } = require("../../helper")
const configuration = require("../../helpers/configuration")
const Security = require("../models/security/security")

class User {
  constructor(name, password, role, email, branch) {
    this.name = name
    this.password = password
    this.role = role
    this.email = email
    this.branch = branch
  }

  async checkUserExist() {
    let result = await promisifyQuery(`SELECT * FROM roles WHERE email = ?`, [this.email])
    return result.length == 0 ? false : true
  }

  hashPassword = async () => {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    return this.password
  }

  isPasswordSame = async (password, hashpassword) => {
    return await bcrypt.compare(password, hashpassword)
  }
  insertionOne = async (name, password) => {
    if (!this.branch) {
      throw new Error("User must be assigned a branch")
    }
    let parsedBranch = parseInt(this.branch)
    if (typeof parsedBranch != "number") {
      throw new TypeError("branch must be an integer")
    }
    return promisifyQuery(
      `INSERT INTO roles (username,password,role,email,branch) 
         VALUES (?,?,?,?,?)`,
      [name, password, this.role, this.email, this.branch]
    )
  }

  getUserData = async (email) => {
    try {
      const queryString = `SELECT * FROM roles WHERE EMAIL = ?`
      const result = await promisifyQuery(queryString, email)
      if (result.length === 0) return false
      const data = result[0];
      return data;
    } catch (err) {
      logger.error(err)
      return false
    }
  }
  processUserData = async (data) => {
    let user = convertKeysToLowerCase(data)
    const { permissions, email, activation, username, role, employeeid, branch } = user
    if (activation != 1) {
      return `Access Denied!!. User not activated to have access`
    }
    if (permissions == "{}") {
      return `Access Denied!!. Permissions not set`
    }
    if (configuration.configurations.strictBranchCheck) {
      if (branch <= 0 || branch == undefined) {
        return "Acess Denied!!.User not assigned to a branch"
      }
    }
    let branchname = null;
    if (branch) {
      branchname = await promisifyQuery(`SELECT name from branch WHERE branchid = ?`, [parseInt(branch)]);
      if (branchname.length > 0) {
        branchname = branchname[0]['name'];
      }
    }
    return (user = { permissions, role, activation, email, employeeid, username, branchid: branch, branch: branchname })
  }

  createUser = async () => {
    try {
      const isUserExist = await this.checkUserExist()
      if (isUserExist) return "user already exist"
      const hashPassword = await this.hashPassword()
      return await this.insertionOne(this.name, hashPassword)
    } catch (err) {
      logger.error(err)
      throw new Error(err?.message || "error creating user")
    }
  }

  checkLogins = async (email, password) => {
    const queryString = `SELECT password FROM roles WHERE EMAIL = ?`
    try {
      const storedPassword = await promisifyQuery(queryString, email)
      if (storedPassword.length === 0) return false
      return await bcrypt.compare(password, storedPassword[0]?.password)
    } catch (err) {
      logger.error(err)
      throw new Error(err?.message || "something went wrong")
    }
  }

  applicationAccessToken = async function () {
    return jwt.sign({ clientid: 74747 }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1y" })
  }

  createAccessTokenCredentials = async (accesskey, email, data, expiresIn) => {
    try {
      const accessToken = jwt.sign({ ...data }, accesskey, { expiresIn })
      return accessToken
    } catch (err) {
      logger.error(err)
      throw new Error(err?.message || "something went wrong")
    }
  }

  validateRequestToken = async (req, res, next, accessSecret) => {
    try {
      const accessToken = req.headers.authorization && req.headers.authorization.split(" ")[1]
      if (!accessToken) {
        return customError("Unauthorized to acesss service.", 401, res)
      }
      const isValidated = await this.verifyToken(accessToken)
      if (isValidated) {
        next()
      }
    } catch (err) {
      return customError("Application licenced expired, please contact admin for renewal", 401, res)
    }
  }

  validateEmployeeToken = async function (request, response) {
    try {
      const { token } = request.query
      if (!token) {
        return customError("token not provided", 404, response)
      }
      const tokenvalid = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)


      if (!tokenvalid) {
        return customError("token provided is invalid", 401, response)
      }

      const { role, employeeid } = tokenvalid;

      const isUserLoggedIn = await new Security(employeeid).getCanInitiateLogin();
      if (isUserLoggedIn) {
        return response.send({ loggedIn: false, message: 'user is not loggedIn' });
      }

      if (!role) {
        return customError("token is invalid", 404, response)
      }

      switch (role) {
        case "clinician" || "patient":
          response.send({ statusCode: 200, status: "success", user: tokenvalid })
          break
        default:
          const allValid = ["username", "activation", "email", "employeeid", "permissions", "role"].some((item, index) => tokenvalid.hasOwnProperty(item) == false)
          if (allValid) { return customError("invalid token data received", 401, response) }
          let branch = await promisifyQuery(`SELECT name from branch WHERE branchid = ?`, [parseInt(tokenvalid?.branchid)]);
          if (branch.length > 0) {
            branch = branch[0]['name'];
          }
          response.send({ statusCode: 200, status: "success", user: { ...tokenvalid, branch } })
      }
    } catch (err) {
      return customError("Expired token", 404, response)
    }
  }

  verifyToken = async (token) => {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  }

  tokenizeData = async (data, expiresIn) => {
    return jwt.sign({ ...data }, process.env.ACCESS_TOKEN_SECRET, { expiresIn })
  }

  getUserRole = async (employeeid) => {
    const data = await promisifyQuery(`SELECT role FROM roles WHERE employeeid = ?`, [employeeid])
    return data.length > 0 ? data[0]["role"] : null
  }

  userExistWithId = async (id) => {
    try {
      const query = `SELECT * FROM roles WHERE EMPLOYEEID = ?`
      const result = await promisifyQuery(query, id)
      return result.length === 0 ? false : result
    } catch (err) {
      logger.error(err)
      throw new Error(err?.message || "something went wrong")
    }
  }
}

module.exports = User
